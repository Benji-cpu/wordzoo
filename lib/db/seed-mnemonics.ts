import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { generateText } from '../ai/gemini';
import { generateImage } from '../ai/stability';
import {
  MNEMONIC_SYSTEM_PROMPT,
  buildGeneratePrompt,
} from '../ai/prompts';
import { filterMnemonicContent } from '../ai/safety';
import type { MnemonicCandidate } from '../../types/ai';

function parseCandidates(text: string): MnemonicCandidate[] {
  const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
  return parsed.map((c: Record<string, unknown>) => ({
    keyword: String(c.keyword ?? ''),
    phoneticLink: String(c.phoneticLink ?? ''),
    sceneDescription: String(c.sceneDescription ?? ''),
    imagePrompt: String(c.imagePrompt ?? ''),
  }));
}

// Language IDs from seed.ts
const ID_LANG = 'a1b2c3d4-0001-4000-8000-000000000001';
const ES_LANG = 'a1b2c3d4-0001-4000-8000-000000000002';
const JA_LANG = 'a1b2c3d4-0001-4000-8000-000000000003';

// Words to add that aren't in the existing seed
const NEW_WORDS = [
  // Indonesian
  { id: 'b1000000-0001-4000-8000-000000000021', languageId: ID_LANG, text: 'kucing', meaning: 'cat', pos: 'noun', rank: 21 },
  { id: 'b1000000-0001-4000-8000-000000000022', languageId: ID_LANG, text: 'besar', meaning: 'big', pos: 'adjective', rank: 22 },
  // Spanish
  { id: 'b2000000-0001-4000-8000-000000000021', languageId: ES_LANG, text: 'mariposa', meaning: 'butterfly', pos: 'noun', rank: 21 },
  { id: 'b2000000-0001-4000-8000-000000000022', languageId: ES_LANG, text: 'cerveza', meaning: 'beer', pos: 'noun', rank: 22 },
  { id: 'b2000000-0001-4000-8000-000000000023', languageId: ES_LANG, text: 'perezoso', meaning: 'lazy', pos: 'adjective', rank: 23 },
  // Japanese
  { id: 'b3000000-0001-4000-8000-000000000021', languageId: JA_LANG, text: '猫', romanization: 'neko', meaning: 'cat', pos: 'noun', rank: 21 },
  { id: 'b3000000-0001-4000-8000-000000000022', languageId: JA_LANG, text: 'かわいい', romanization: 'kawaii', meaning: 'cute', pos: 'adjective', rank: 22 },
];

// All 15 onboarding words: { wordId, text (for prompt), meaning, language }
const ONBOARDING_WORDS = [
  // Indonesian (5)
  { wordId: 'b1000000-0001-4000-8000-000000000021', text: 'kucing', meaning: 'cat', language: 'Indonesian' },
  { wordId: 'b1000000-0001-4000-8000-000000000022', text: 'besar', meaning: 'big', language: 'Indonesian' },
  { wordId: 'b1000000-0001-4000-8000-000000000012', text: 'makan', meaning: 'eat', language: 'Indonesian' },
  { wordId: 'b1000000-0001-4000-8000-000000000001', text: 'saya', meaning: 'I / me', language: 'Indonesian' },
  { wordId: 'b1000000-0001-4000-8000-000000000009', text: 'nama', meaning: 'name', language: 'Indonesian' },
  // Spanish (5)
  { wordId: 'b2000000-0001-4000-8000-000000000021', text: 'mariposa', meaning: 'butterfly', language: 'Spanish' },
  { wordId: 'b2000000-0001-4000-8000-000000000022', text: 'cerveza', meaning: 'beer', language: 'Spanish' },
  { wordId: 'b2000000-0001-4000-8000-000000000023', text: 'perezoso', meaning: 'lazy', language: 'Spanish' },
  { wordId: 'b2000000-0001-4000-8000-000000000001', text: 'hola', meaning: 'hello', language: 'Spanish' },
  { wordId: 'b2000000-0001-4000-8000-000000000002', text: 'gracias', meaning: 'thank you', language: 'Spanish' },
  // Japanese (5)
  { wordId: 'b3000000-0001-4000-8000-000000000021', text: 'neko', meaning: 'cat', language: 'Japanese' },
  { wordId: 'b3000000-0001-4000-8000-000000000022', text: 'kawaii', meaning: 'cute', language: 'Japanese' },
  { wordId: 'b3000000-0001-4000-8000-000000000008', text: 'taberu', meaning: 'to eat', language: 'Japanese' },
  { wordId: 'b3000000-0001-4000-8000-000000000003', text: 'arigatou', meaning: 'thank you', language: 'Japanese' },
  { wordId: 'b3000000-0001-4000-8000-000000000015', text: 'oishii', meaning: 'delicious', language: 'Japanese' },
];

async function seedMnemonics() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('=== Seeding Onboarding Mnemonics ===\n');

  // Step 1: Insert new words that aren't in the DB
  console.log('Inserting new onboarding words...');
  for (const w of NEW_WORDS) {
    const rom = 'romanization' in w ? (w as { romanization: string }).romanization : null;
    await sql`
      INSERT INTO words (id, language_id, text, romanization, meaning_en, part_of_speech, frequency_rank)
      VALUES (${w.id}, ${w.languageId}, ${w.text}, ${rom}, ${w.meaning}, ${w.pos}, ${w.rank})
      ON CONFLICT DO NOTHING
    `;
    console.log(`  + ${w.text} (${w.meaning})`);
  }

  // Step 2: Generate mnemonics for each onboarding word
  let successCount = 0;
  let failCount = 0;

  for (const word of ONBOARDING_WORDS) {
    console.log(`\n--- Generating mnemonic for "${word.text}" (${word.meaning}) [${word.language}] ---`);

    try {
      // Check if mnemonic already exists for this word (shared/default)
      const existing = await sql`
        SELECT id FROM mnemonics WHERE word_id = ${word.wordId} AND user_id IS NULL LIMIT 1
      `;
      if (existing.length > 0) {
        console.log('  Skipping — already has a shared mnemonic');
        successCount++;
        continue;
      }

      // Generate candidates via Gemini
      const prompt = `${MNEMONIC_SYSTEM_PROMPT}\n\n${buildGeneratePrompt(word.text, word.meaning, word.language)}`;
      const response = await generateText(prompt, { temperature: 0.9, maxOutputTokens: 2048 });
      const candidates = parseCandidates(response.text);

      // Find first safe candidate
      const safeCandidates = candidates.filter((c) => filterMnemonicContent(c).safe);
      if (safeCandidates.length === 0) {
        console.error('  All candidates filtered by safety check!');
        failCount++;
        continue;
      }

      const best = safeCandidates[0];
      console.log(`  Keyword: "${best.keyword}"`);
      console.log(`  Phonetic: ${best.phoneticLink}`);
      console.log(`  Scene: ${best.sceneDescription.substring(0, 80)}...`);

      // Generate image
      console.log('  Generating image...');
      const imageResult = await generateImage(best.imagePrompt);
      console.log(`  Image URL: ${imageResult.imageUrl}`);

      // Save to database with user_id = NULL (shared mnemonic)
      await sql`
        INSERT INTO mnemonics (word_id, user_id, keyword_text, scene_description, image_url, is_custom)
        VALUES (${word.wordId}, ${null}, ${best.keyword}, ${best.sceneDescription}, ${imageResult.imageUrl}, false)
      `;
      console.log('  Saved to database!');
      successCount++;
    } catch (error) {
      console.error(`  Failed: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(`\n=== Done! ${successCount} succeeded, ${failCount} failed ===`);
}

seedMnemonics();
