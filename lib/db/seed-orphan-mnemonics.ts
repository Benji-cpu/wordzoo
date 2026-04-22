/**
 * Backfill canonical mnemonics (user_id NULL) for scene words that have no
 * mnemonic row at all. Without this, the UI correctly shows "Visual coming
 * soon" because the data simply doesn't exist.
 *
 * Runs the same generation pipeline as /api/mnemonics/generate (Gemini for
 * candidates, Stability AI for the image) and inserts a single row per word.
 *
 * Flags:
 *   --dry-run           — list targets, no API calls / no writes
 *   --lang=id|es|all    — restrict by language name (default: all)
 *   --only=word1,word2  — target specific word texts (substring match)
 *   --limit=N           — cap total words processed (default: 5)
 *   --delay=ms          — delay between items to respect rate limits (default: 2500)
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const langArg = process.argv.find((a) => a.startsWith('--lang='))?.replace('--lang=', '') ?? 'all';
const limitArg = parseInt(process.argv.find((a) => a.startsWith('--limit='))?.replace('--limit=', '') ?? '5', 10);
const delayMs = parseInt(process.argv.find((a) => a.startsWith('--delay='))?.replace('--delay=', '') ?? '2500', 10);
const onlyWords = process.argv.find((a) => a.startsWith('--only='))?.replace('--only=', '').split(',').map((w) => w.trim());
const isDryRun = process.argv.includes('--dry-run');

const languageNameMap: Record<string, string> = {
  id: 'Indonesian',
  es: 'Spanish',
  ja: 'Japanese',
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  // Deferred imports so env vars are set before client.ts loads.
  const { GoogleGenAI } = await import('@google/genai');
  const { MNEMONIC_SYSTEM_PROMPT, buildGeneratePrompt } = await import('../ai/prompts');
  const { generateImage } = await import('../ai/image-generation');
  const { filterMnemonicContent } = await import('../ai/safety');

  const gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });

  async function generateCandidate(
    word: string,
    meaning: string,
    language: string
  ): Promise<{ keyword: string; bridgeSentence: string; sceneDescription: string; imagePrompt: string } | null> {
    const prompt = buildGeneratePrompt(word, meaning, language);
    const res = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: MNEMONIC_SYSTEM_PROMPT,
        temperature: 0.9,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });
    const text = res.text ?? '[]';
    let parsed: Array<Record<string, unknown>>;
    try {
      const raw = JSON.parse(text);
      parsed = Array.isArray(raw) ? raw : [];
    } catch (e) {
      console.error(`  JSON parse error: ${(e as Error).message}. Raw: ${text.slice(0, 120)}...`);
      return null;
    }
    for (const c of parsed) {
      const cand = {
        keyword: String(c.keyword ?? ''),
        phoneticLink: String(c.phoneticLink ?? ''),
        bridgeSentence: String(c.bridgeSentence ?? ''),
        sceneDescription: String(c.sceneDescription ?? ''),
        imagePrompt: String(c.imagePrompt ?? ''),
      };
      if (!cand.keyword || !cand.imagePrompt) continue;
      if (filterMnemonicContent(cand).safe) return cand;
    }
    return null;
  }

  const langName = languageNameMap[langArg];

  console.log(`=== Backfilling orphan mnemonics${isDryRun ? ' [DRY RUN]' : ''} ===`);
  console.log(`  lang=${langArg}${langName ? ` (${langName})` : ''} limit=${limitArg} delay=${delayMs}ms`);
  if (onlyWords) console.log(`  only=${onlyWords.join(', ')}`);
  console.log('');

  let orphans: Array<{ id: string; text: string; meaning_en: string; language_name: string }> = [];

  if (langName) {
    orphans = (await sql`
      SELECT DISTINCT w.id, w.text, w.meaning_en, l.name AS language_name
      FROM words w
      JOIN scene_words sw ON sw.word_id = w.id
      JOIN languages l ON l.id = w.language_id
      WHERE l.name = ${langName}
        AND NOT EXISTS (SELECT 1 FROM mnemonics m WHERE m.word_id = w.id AND m.user_id IS NULL)
      ORDER BY w.text
    `) as typeof orphans;
  } else {
    orphans = (await sql`
      SELECT DISTINCT w.id, w.text, w.meaning_en, l.name AS language_name
      FROM words w
      JOIN scene_words sw ON sw.word_id = w.id
      JOIN languages l ON l.id = w.language_id
      WHERE NOT EXISTS (SELECT 1 FROM mnemonics m WHERE m.word_id = w.id AND m.user_id IS NULL)
      ORDER BY l.name, w.text
    `) as typeof orphans;
  }

  if (onlyWords) {
    orphans = orphans.filter((w) => onlyWords.some((o) => w.text.toLowerCase().includes(o.toLowerCase())));
  }

  console.log(`Found ${orphans.length} orphan words.`);
  const target = orphans.slice(0, limitArg);
  console.log(`Processing ${target.length} (limit ${limitArg}).\n`);

  if (target.length === 0) return;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < target.length; i++) {
    const w = target[i];
    console.log(`[${i + 1}/${target.length}] "${w.text}" (${w.meaning_en}) [${w.language_name}]`);

    if (isDryRun) {
      console.log('  → DRY RUN: would generate keyword + image + insert mnemonic row');
      successCount++;
      continue;
    }

    try {
      console.log('  Generating candidate keyword + scene...');
      const candidate = await generateCandidate(w.text, w.meaning_en, w.language_name);
      if (!candidate) {
        console.error('  FAIL: no safe candidate returned');
        failCount++;
        await sleep(delayMs);
        continue;
      }
      console.log(`  Keyword: "${candidate.keyword}"`);

      console.log('  Generating image...');
      const img = await generateImage(candidate.imagePrompt);
      console.log(`  Image URL: ${img.imageUrl}`);

      await sql`
        INSERT INTO mnemonics (word_id, user_id, keyword_text, scene_description, bridge_sentence, image_url, is_custom)
        VALUES (${w.id}, NULL, ${candidate.keyword}, ${candidate.sceneDescription}, ${candidate.bridgeSentence || null}, ${img.imageUrl}, false)
      `;
      console.log(`  Saved.`);
      successCount++;

      if (i < target.length - 1) await sleep(delayMs);
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
      await sleep(delayMs);
    }
  }

  console.log(`\n=== Done! ${successCount} generated, ${failCount} failed ===`);
  if (isDryRun) console.log('(Dry run — no changes made to the database)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
