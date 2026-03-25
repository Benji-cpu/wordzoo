import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { generateScene } from '../lib/ai/content-generation';
import { randomUUID } from 'crypto';

const USAGE = `
Usage: npx tsx scripts/generate-scene.ts --topic="food ordering" --language=Indonesian --path-id=<uuid>

Options:
  --topic       Topic for the scene (required)
  --language    Language name (default: Indonesian)
  --lang-code   Language code (default: id)
  --lang-id     Language UUID in DB (default: Indonesian UUID)
  --path-id     Path UUID to add scene to (required)
  --word-count  Number of words to generate (default: 10)
  --dry-run     Print generated content without inserting into DB
`;

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.split('=');
      return [k.replace(/^--/, ''), v ?? 'true'];
    })
  );

  if (!args.topic || !args['path-id']) {
    console.log(USAGE);
    process.exit(1);
  }

  const topic = args.topic;
  const languageName = args.language ?? 'Indonesian';
  const languageCode = args['lang-code'] ?? 'id';
  const languageId = args['lang-id'] ?? 'a1b2c3d4-0001-4000-8000-000000000001';
  const pathId = args['path-id'];
  const wordCount = parseInt(args['word-count'] ?? '10');
  const dryRun = args['dry-run'] === 'true';

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && !dryRun) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = dryRun ? null : neon(databaseUrl!);

  // Get existing words to avoid duplicates
  let existingWords: string[] = [];
  if (sql) {
    const rows = await sql`SELECT text FROM words WHERE language_id = ${languageId}`;
    existingWords = rows.map(r => (r as { text: string }).text);
  }

  console.log(`Generating scene: "${topic}" for ${languageName}...`);
  console.log(`Excluding ${existingWords.length} existing words`);

  const scene = await generateScene(topic, languageName, languageCode, existingWords, wordCount);

  console.log(`\nGenerated: "${scene.title}"`);
  console.log(`Words: ${scene.words.length}, Dialogues: ${scene.dialogues.length}, Phrases: ${scene.phrases.length}`);

  if (dryRun) {
    console.log(JSON.stringify(scene, null, 2));
    return;
  }

  // Insert into database
  console.log('\nInserting into database...');

  // 1. Get next sort_order for this path
  const sortRows = await sql!`SELECT COALESCE(MAX(sort_order), 0)::int AS max_sort FROM scenes WHERE path_id = ${pathId}`;
  const nextSort = (sortRows[0] as { max_sort: number }).max_sort + 1;

  // 2. Create scene
  const sceneId = randomUUID();
  await sql!`
    INSERT INTO scenes (id, path_id, title, description, scene_type, scene_context, sort_order)
    VALUES (${sceneId}, ${pathId}, ${scene.title}, ${scene.description}, 'dialogue', ${scene.scene_context}, ${nextSort})
  `;
  console.log(`  Scene: ${scene.title} (sort_order: ${nextSort})`);

  // 3. Insert words + mnemonics
  let pathWordSort = 0;
  const sortRes = await sql!`SELECT COALESCE(MAX(sort_order), 0)::int AS max_sort FROM path_words WHERE path_id = ${pathId}`;
  pathWordSort = (sortRes[0] as { max_sort: number }).max_sort;

  for (let i = 0; i < scene.words.length; i++) {
    const w = scene.words[i];
    const wordId = randomUUID();

    await sql!`
      INSERT INTO words (id, language_id, text, romanization, meaning_en, part_of_speech)
      VALUES (${wordId}, ${languageId}, ${w.text}, ${w.romanization}, ${w.meaning_en}, ${w.part_of_speech})
      ON CONFLICT DO NOTHING
    `;

    await sql!`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES (${sceneId}, ${wordId}, ${i + 1}) ON CONFLICT DO NOTHING`;
    await sql!`INSERT INTO path_words (path_id, word_id, sort_order) VALUES (${pathId}, ${wordId}, ${++pathWordSort}) ON CONFLICT DO NOTHING`;

    // Insert mnemonic
    const mnemonic = scene.mnemonics.find(m => m.word_text === w.text);
    if (mnemonic) {
      await sql!`
        INSERT INTO mnemonics (word_id, keyword_text, scene_description, bridge_sentence)
        VALUES (${wordId}, ${mnemonic.keyword_text}, ${mnemonic.scene_description}, ${mnemonic.bridge_sentence})
      `;
    }

    console.log(`  Word: ${w.text} → ${w.meaning_en}`);
  }

  // 4. Insert dialogues
  for (let i = 0; i < scene.dialogues.length; i++) {
    const d = scene.dialogues[i];
    await sql!`
      INSERT INTO scene_dialogues (scene_id, sort_order, speaker, text_target, text_en)
      VALUES (${sceneId}, ${i + 1}, ${d.speaker}, ${d.text_target}, ${d.text_en})
    `;
  }

  // 5. Insert phrases
  for (let i = 0; i < scene.phrases.length; i++) {
    const p = scene.phrases[i];
    await sql!`
      INSERT INTO scene_phrases (scene_id, sort_order, text_target, text_en, literal_translation, usage_note)
      VALUES (${sceneId}, ${i + 1}, ${p.text_target}, ${p.text_en}, ${p.literal_translation}, ${p.usage_note})
    `;
  }

  console.log(`\nDone! Scene "${scene.title}" added to path ${pathId}`);
}

main().catch(console.error);
