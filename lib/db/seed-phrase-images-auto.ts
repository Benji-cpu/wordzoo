import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { GoogleGenAI } from '@google/genai';
import { generateImage } from '../ai/image-generation';
import {
  PHRASE_MNEMONIC_SYSTEM_PROMPT,
  buildPhraseMnemonicPrompt,
} from '../ai/prompts';

// --- CLI flags ---
const isDryRun = process.argv.includes('--dry-run');
const isForce = process.argv.includes('--force');
const onlyPhrases = process.argv
  .find((a) => a.startsWith('--only='))
  ?.replace('--only=', '')
  .split(',')
  .map((w) => w.trim());

interface PhraseMnemonicResult {
  phraseBridgeSentence: string;
  compositeSceneDescription: string;
  compositeImagePrompt: string;
}

async function generatePhraseMnemonic(
  phraseText: string,
  phraseMeaning: string,
  literalTranslation: string,
  wordKeywords: { word: string; keyword: string; meaning: string }[]
): Promise<PhraseMnemonicResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY not set');

  const ai = new GoogleGenAI({ apiKey });

  let prompt: string;
  if (wordKeywords.length > 0) {
    prompt = buildPhraseMnemonicPrompt(
      phraseText,
      phraseMeaning,
      literalTranslation,
      wordKeywords
    );
  } else {
    // Fallback: no word keywords available, generate from literal translation alone
    prompt = `Generate a mnemonic image for the Indonesian phrase "${phraseText}" meaning "${phraseMeaning}".
Literal word-by-word: "${literalTranslation}".
Create a vivid, memorable visual scene that helps an English speaker remember this phrase.
Return JSON: { phraseBridgeSentence, compositeSceneDescription, compositeImagePrompt }`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: PHRASE_MNEMONIC_SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(response.text ?? '{}') as PhraseMnemonicResult;
}

async function seedPhraseImagesAuto() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  const modeLabel = isDryRun
    ? ' [DRY RUN]'
    : isForce
      ? ' [FORCE]'
      : '';
  console.log(`=== Auto-generating phrase mnemonic images${modeLabel} ===\n`);

  // Fetch all phrases (optionally filtered to missing images)
  const allPhrases = await sql`
    SELECT
      sp.id,
      sp.text_target,
      sp.text_en,
      sp.literal_translation,
      sp.phrase_bridge_sentence,
      sp.composite_image_url,
      s.title AS scene_title,
      s.id AS scene_id
    FROM scene_phrases sp
    JOIN scenes s ON s.id = sp.scene_id
    ORDER BY s.sort_order, sp.sort_order
  `;

  // Filter to target phrases
  let targetPhrases = allPhrases;
  if (onlyPhrases) {
    targetPhrases = allPhrases.filter((p) =>
      onlyPhrases.some((o) => p.text_target.includes(o))
    );
  } else if (!isForce) {
    targetPhrases = allPhrases.filter((p) => !p.phrase_bridge_sentence);
  }

  console.log(
    `Found ${allPhrases.length} total phrases. Targeting ${targetPhrases.length} phrases.\n`
  );

  if (targetPhrases.length === 0) {
    console.log('Nothing to do. Use --force to regenerate existing phrases.');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetPhrases.length; i++) {
    const phrase = targetPhrases[i];
    console.log(
      `\n[${i + 1}/${targetPhrases.length}] "${phrase.text_target}" (${phrase.text_en}) [${phrase.scene_title}]`
    );

    if (isDryRun) {
      console.log('  → DRY RUN: would generate mnemonic + image');
      successCount++;
      continue;
    }

    try {
      // Fetch word keywords for this phrase via phrase_words join
      const wordKeywords = await sql`
        SELECT
          w.text AS word,
          m.keyword_text AS keyword,
          w.meaning_en AS meaning
        FROM phrase_words pw
        JOIN words w ON w.id = pw.word_id
        LEFT JOIN LATERAL (
          SELECT keyword_text FROM mnemonics
          WHERE word_id = w.id AND user_id IS NULL
          ORDER BY upvote_count DESC NULLS LAST
          LIMIT 1
        ) m ON true
        WHERE pw.phrase_id = ${phrase.id}
        ORDER BY pw.position
      `;

      const keywords = wordKeywords
        .filter((r) => r.keyword)
        .map((r) => ({
          word: r.word as string,
          keyword: r.keyword as string,
          meaning: r.meaning as string,
        }));

      console.log(
        `  Keywords: ${keywords.length > 0 ? keywords.map((k) => `"${k.keyword}"`).join(', ') : '(none — using fallback prompt)'}`
      );

      // Generate mnemonic data via Gemini
      console.log('  Generating mnemonic...');
      const mnemonicData = await generatePhraseMnemonic(
        phrase.text_target as string,
        phrase.text_en as string,
        (phrase.literal_translation as string) ?? '',
        keywords
      );

      // Generate image
      console.log('  Generating image...');
      const imageResult = await generateImage(mnemonicData.compositeImagePrompt);
      console.log(`  Image URL: ${imageResult.imageUrl}`);

      // Save to DB
      await sql`
        UPDATE scene_phrases SET
          phrase_bridge_sentence = ${mnemonicData.phraseBridgeSentence},
          composite_image_url = ${imageResult.imageUrl},
          composite_scene_description = ${mnemonicData.compositeSceneDescription}
        WHERE id = ${phrase.id}
      `;

      console.log('  Saved!');
      successCount++;
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(
    `\n=== Done! ${successCount} generated, ${failCount} failed ===`
  );
  if (isDryRun) {
    console.log('(Dry run — no changes made to the database)');
  }
}

seedPhraseImagesAuto();
