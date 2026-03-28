import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { generateImage } from '../ai/image-generation';
import { MNEMONIC_DATA } from './mnemonic-data';

// Language IDs from seed.ts
const ID_LANG = 'a1b2c3d4-0001-4000-8000-000000000001';
const ES_LANG = 'a1b2c3d4-0001-4000-8000-000000000002';
const JA_LANG = 'a1b2c3d4-0001-4000-8000-000000000003';

// Extra words to add that aren't in the base seed
const NEW_WORDS = [
  // Indonesian
  { id: 'b1000000-0001-4000-8000-000000000041', languageId: ID_LANG, text: 'kucing', meaning: 'cat', pos: 'noun', rank: 21 },
  { id: 'b1000000-0001-4000-8000-000000000042', languageId: ID_LANG, text: 'besar', meaning: 'big', pos: 'adjective', rank: 22 },
  // Spanish
  { id: 'b2000000-0001-4000-8000-000000000021', languageId: ES_LANG, text: 'mariposa', meaning: 'butterfly', pos: 'noun', rank: 21 },
  { id: 'b2000000-0001-4000-8000-000000000022', languageId: ES_LANG, text: 'cerveza', meaning: 'beer', pos: 'noun', rank: 22 },
  { id: 'b2000000-0001-4000-8000-000000000023', languageId: ES_LANG, text: 'perezoso', meaning: 'lazy', pos: 'adjective', rank: 23 },
  // Japanese
  { id: 'b3000000-0001-4000-8000-000000000021', languageId: JA_LANG, text: '猫', romanization: 'neko', meaning: 'cat', pos: 'noun', rank: 21 },
  { id: 'b3000000-0001-4000-8000-000000000022', languageId: JA_LANG, text: 'かわいい', romanization: 'kawaii', meaning: 'cute', pos: 'adjective', rank: 22 },
];

// Parse --only=word1,word2,... flag for selective regeneration
const onlyWords = process.argv.find(a => a.startsWith('--only='))
  ?.replace('--only=', '')
  .split(',')
  .map(w => w.trim());

async function seedMnemonics() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  if (onlyWords) {
    console.log(`=== Selective Seeding: ${onlyWords.join(', ')} ===\n`);
  } else {
    console.log('=== Seeding Mnemonics for ALL Words ===\n');
  }

  // Step 1: Insert extra words that aren't in the DB
  console.log('Inserting extra words...');
  for (const w of NEW_WORDS) {
    const rom = 'romanization' in w ? (w as { romanization: string }).romanization : null;
    await sql`
      INSERT INTO words (id, language_id, text, romanization, meaning_en, part_of_speech, frequency_rank)
      VALUES (${w.id}, ${w.languageId}, ${w.text}, ${rom}, ${w.meaning}, ${w.pos}, ${w.rank})
      ON CONFLICT DO NOTHING
    `;
    console.log(`  + ${w.text} (${w.meaning})`);
  }

  // Step 2: Query ALL words with their language names
  const allWords = await sql`
    SELECT w.id, w.text, w.romanization, w.meaning_en, l.name AS language_name
    FROM words w
    JOIN languages l ON l.id = w.language_id
    ORDER BY l.name, w.frequency_rank
  `;

  console.log(`\nFound ${allWords.length} words total.\n`);

  // Step 3: Generate mnemonics for each word without one
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  let noDataCount = 0;

  for (let i = 0; i < allWords.length; i++) {
    const word = allWords[i];
    const wordText = word.romanization || word.text; // Use romanization for Japanese
    const displayText = word.romanization ? `${word.text} (${word.romanization})` : word.text;

    console.log(`\n--- [${i + 1}/${allWords.length}] "${displayText}" -> ${word.meaning_en} [${word.language_name}] ---`);

    // If --only flag is set, skip words not in the list
    if (onlyWords) {
      const matchesOnly = onlyWords.some(w => w === wordText || w === word.text);
      if (!matchesOnly) {
        console.log('  Skipping -- not in --only list');
        skipCount++;
        continue;
      }
    }

    // Look up pre-generated mnemonic data
    // Try both the original text and romanization as keys
    const key1 = `${word.language_name}:${word.text}`;
    const key2 = word.romanization ? `${word.language_name}:${word.romanization}` : null;
    const data = MNEMONIC_DATA[key1] ?? (key2 ? MNEMONIC_DATA[key2] : undefined);

    if (!data) {
      console.log(`  No pre-generated mnemonic data found (tried: ${key1}${key2 ? `, ${key2}` : ''})`);
      noDataCount++;
      continue;
    }

    try {
      // For --only mode, delete existing mnemonic first (re-seeding)
      if (onlyWords) {
        await sql`DELETE FROM mnemonics WHERE word_id = ${word.id} AND user_id IS NULL`;
        console.log('  Deleted existing shared mnemonic (re-seeding)');
      } else {
        // Check if shared mnemonic already exists
        const existing = await sql`
          SELECT id FROM mnemonics WHERE word_id = ${word.id} AND user_id IS NULL LIMIT 1
        `;
        if (existing.length > 0) {
          console.log('  Skipping -- already has a shared mnemonic');
          skipCount++;
          continue;
        }
      }

      console.log(`  Keyword: "${data.keyword}"`);
      console.log(`  Scene: ${data.sceneDescription.substring(0, 100)}...`);

      // Generate image via Nano Banana 2
      console.log('  Generating image...');
      const imageResult = await generateImage(data.imagePrompt);
      console.log(`  Image URL: ${imageResult.imageUrl}`);

      // Save to database with user_id = NULL (shared mnemonic)
      await sql`
        INSERT INTO mnemonics (word_id, user_id, keyword_text, scene_description, bridge_sentence, image_url, is_custom)
        VALUES (${word.id}, ${null}, ${data.keyword}, ${data.sceneDescription}, ${data.bridgeSentence}, ${imageResult.imageUrl}, false)
      `;
      console.log('  Saved to database!');
      successCount++;
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(`\n=== Done! ${successCount} generated, ${skipCount} skipped, ${noDataCount} missing data, ${failCount} failed ===`);
}

seedMnemonics();
