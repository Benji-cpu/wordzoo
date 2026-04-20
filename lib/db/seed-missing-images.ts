import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { GoogleGenAI } from '@google/genai';
import { generateImage } from '../ai/image-generation';
import { MNEMONIC_DATA } from './mnemonic-data';
import {
  PHRASE_MNEMONIC_SYSTEM_PROMPT,
  buildPhraseMnemonicPrompt,
} from '../ai/prompts';

// --- CLI flags ---
const typeArg = process.argv
  .find((a) => a.startsWith('--type='))
  ?.replace('--type=', '') ?? 'mnemonics';

const limitArg = parseInt(
  process.argv.find((a) => a.startsWith('--limit='))?.replace('--limit=', '') ?? '10',
  10
);

const delayMs = parseInt(
  process.argv.find((a) => a.startsWith('--delay='))?.replace('--delay=', '') ?? '2000',
  10
);

const isDryRun = process.argv.includes('--dry-run');

// --- DB ---
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}
const sql = neon(databaseUrl);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Phrase mnemonic generation (reused from seed-phrase-images-auto) ---

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
    prompt = `Generate a mnemonic image for the phrase "${phraseText}" meaning "${phraseMeaning}".
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

// --- Main ---

async function seedMissingImages() {
  const types = typeArg === 'all' ? ['mnemonics', 'phrases'] : [typeArg];

  for (const contentType of types) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  Filling missing ${contentType} images${isDryRun ? ' [DRY RUN]' : ''}`);
    console.log(`  Limit: ${limitArg} | Delay: ${delayMs}ms`);
    console.log(`${'='.repeat(60)}\n`);

    if (contentType === 'mnemonics') {
      await fillMnemonicImages();
    } else if (contentType === 'phrases') {
      await fillPhraseImages();
    } else {
      console.error(`Unknown type: ${contentType}. Use: mnemonics, phrases, or all`);
      process.exit(1);
    }
  }
}

async function fillMnemonicImages() {
  // Fetch mnemonics with the language name for MNEMONIC_DATA lookup
  const rows = await sql`
    SELECT m.id, m.word_id, m.keyword_text, m.scene_description,
      w.text AS word_text, w.meaning_en,
      l.name AS language_name,
      s.title AS scene_title
    FROM mnemonics m
    JOIN words w ON w.id = m.word_id
    JOIN languages l ON l.id = w.language_id
    LEFT JOIN scene_words sw ON sw.word_id = w.id
    LEFT JOIN scenes s ON s.id = sw.scene_id
    WHERE m.user_id IS NULL
      AND m.image_url IS NULL
      AND m.scene_description IS NOT NULL
    ORDER BY l.name, w.text
  `;

  // Deduplicate (a word in multiple scenes produces duplicate rows)
  const seen = new Set<string>();
  const mnemonics = rows.filter((r) => {
    const id = r.id as string;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  console.log(`Found ${mnemonics.length} mnemonics missing images.`);
  const target = mnemonics.slice(0, limitArg);
  console.log(`Processing ${target.length} (limit ${limitArg}).\n`);

  if (target.length === 0) return;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < target.length; i++) {
    const m = target[i];
    const key = `${m.language_name}:${m.word_text}`;
    const prewritten = MNEMONIC_DATA[key];

    console.log(
      `[${i + 1}/${target.length}] "${m.word_text}" (${m.meaning_en}) — keyword: "${m.keyword_text}"` +
      (m.scene_title ? ` [${m.scene_title}]` : '')
    );

    // Determine image prompt: prefer pre-written, fallback to scene_description
    const imagePrompt = prewritten?.imagePrompt ?? (m.scene_description as string);
    console.log(`  Prompt source: ${prewritten ? 'MNEMONIC_DATA' : 'scene_description'}`);

    if (isDryRun) {
      console.log(`  → DRY RUN: would generate image from ${prewritten ? 'pre-written' : 'scene_description'} prompt`);
      console.log(`  → Prompt preview: "${imagePrompt.slice(0, 100)}..."`);
      successCount++;
      continue;
    }

    try {
      console.log('  Generating image...');
      const result = await generateImage(imagePrompt);
      console.log(`  Image URL: ${result.imageUrl}`);

      await sql`UPDATE mnemonics SET image_url = ${result.imageUrl} WHERE id = ${m.id}`;
      console.log('  Saved!');
      successCount++;

      if (i < target.length - 1) {
        await sleep(delayMs);
      }
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(`\nMnemonics: ${successCount} generated, ${failCount} failed`);
}

async function fillPhraseImages() {
  const rows = await sql`
    SELECT sp.id, sp.text_target, sp.text_en, sp.literal_translation,
      sp.phrase_bridge_sentence, sp.composite_scene_description,
      s.title AS scene_title, s.id AS scene_id
    FROM scene_phrases sp
    JOIN scenes s ON s.id = sp.scene_id
    WHERE sp.composite_image_url IS NULL
    ORDER BY s.sort_order, sp.sort_order
  `;

  console.log(`Found ${rows.length} phrases missing images.`);
  const target = rows.slice(0, limitArg);
  console.log(`Processing ${target.length} (limit ${limitArg}).\n`);

  if (target.length === 0) return;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < target.length; i++) {
    const phrase = target[i];
    console.log(
      `[${i + 1}/${target.length}] "${phrase.text_target}" (${phrase.text_en}) [${phrase.scene_title}]`
    );

    if (isDryRun) {
      const hasMnemonicData = !!phrase.phrase_bridge_sentence;
      console.log(`  → DRY RUN: ${hasMnemonicData ? 'has mnemonic data, would generate image only' : 'would generate mnemonic + image'}`);
      successCount++;
      continue;
    }

    try {
      let imagePrompt: string;

      if (phrase.phrase_bridge_sentence && phrase.composite_scene_description) {
        // Already has mnemonic data, just missing the image
        imagePrompt = phrase.composite_scene_description as string;
        console.log('  Using existing scene description for image prompt');
      } else {
        // Need to generate mnemonic data first
        const wordKeywords = await sql`
          SELECT w.text AS word, m.keyword_text AS keyword, w.meaning_en AS meaning
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

        console.log('  Generating mnemonic data...');
        const mnemonicData = await generatePhraseMnemonic(
          phrase.text_target as string,
          phrase.text_en as string,
          (phrase.literal_translation as string) ?? '',
          keywords
        );

        imagePrompt = mnemonicData.compositeImagePrompt;

        // Save mnemonic text data
        await sql`
          UPDATE scene_phrases SET
            phrase_bridge_sentence = ${mnemonicData.phraseBridgeSentence},
            composite_scene_description = ${mnemonicData.compositeSceneDescription}
          WHERE id = ${phrase.id}
        `;
        console.log('  Mnemonic data saved');
      }

      // Generate image
      console.log('  Generating image...');
      const result = await generateImage(imagePrompt);
      console.log(`  Image URL: ${result.imageUrl}`);

      await sql`
        UPDATE scene_phrases SET composite_image_url = ${result.imageUrl}
        WHERE id = ${phrase.id}
      `;
      console.log('  Saved!');
      successCount++;

      if (i < target.length - 1) {
        await sleep(delayMs);
      }
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(`\nPhrases: ${successCount} generated, ${failCount} failed`);
}

seedMissingImages();
