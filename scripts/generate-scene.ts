import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { generateScene, type GeneratedScene } from '../lib/ai/content-generation';
import { validateGeneratedScene } from '../lib/ai/content-validation';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';

const USAGE = `
Usage: npx tsx scripts/generate-scene.ts --topic="food ordering" --path-id=<uuid>
       npx tsx scripts/generate-scene.ts --batch=scenes.json --path-id=<uuid>

Options:
  --topic          Topic for the scene (required unless --batch)
  --batch          Path to JSON file with batch scene definitions
  --language       Language name (default: Indonesian)
  --lang-code      Language code (default: id)
  --lang-id        Language UUID in DB (default: Indonesian UUID)
  --path-id        Path UUID to add scene to (required)
  --word-count     Number of words to generate (default: 10)
  --grammar-focus  Grammar topic for pattern exercises
  --dry-run        Print generated content without inserting into DB

Batch file format:
  {
    "scenes": [
      { "topic": "food ordering", "wordCount": 10, "grammarFocus": "mau + verb" },
      { "topic": "directions", "wordCount": 8 }
    ]
  }
`;

interface BatchScene {
  topic: string;
  wordCount?: number;
  grammarFocus?: string;
}

interface BatchFile {
  scenes: BatchScene[];
}

// ─── Dry-Run Output ────────────────────────────────────────────────────────────

function printFormattedSummary(scene: GeneratedScene): void {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${scene.title}`);
  console.log('='.repeat(60));

  console.log(`\nDescription: ${scene.description}`);
  console.log(`Context: ${scene.scene_context}`);

  console.log(`\nAnchor Image Prompt:`);
  console.log(`  ${scene.anchor_image_prompt}`);

  console.log(`\n--- Words (${scene.words.length}) ---`);
  for (const w of scene.words) {
    const roman = w.romanization ? ` [${w.romanization}]` : '';
    console.log(`  ${w.text}${roman} (${w.part_of_speech}) = ${w.meaning_en}`);
  }

  console.log(`\n--- Mnemonics (${scene.mnemonics.length}) ---`);
  for (const m of scene.mnemonics) {
    console.log(`  ${m.word_text} -> keyword: "${m.keyword_text}"`);
    console.log(`    Bridge: ${m.bridge_sentence}`);
  }

  console.log(`\n--- Dialogue (${scene.dialogues.length} lines) ---`);
  for (const d of scene.dialogues) {
    console.log(`  [${d.speaker}] ${d.text_target}`);
    console.log(`           ${d.text_en}`);
  }

  console.log(`\n--- Phrases (${scene.phrases.length}) ---`);
  for (const p of scene.phrases) {
    console.log(`  ${p.text_target}`);
    console.log(`    = ${p.text_en} (lit: ${p.literal_translation})`);
    if (p.usage_note) console.log(`    Note: ${p.usage_note}`);
  }

  console.log(`\n--- Pattern Exercises (${scene.patterns?.length ?? 0}) ---`);
  if (scene.patterns) {
    for (const p of scene.patterns) {
      console.log(`  [${p.exercise_type}] ${p.prompt}`);
      console.log(`    Answer: ${p.correct_answer} | Distractors: ${p.distractors.join(', ')}`);
      console.log(`    Pattern: ${p.pattern_template} = ${p.pattern_en}`);
      console.log(`    Explanation: ${p.explanation}`);
    }
  }

  console.log('');
}

function printValidationResults(result: { valid: boolean; errors: string[] }): void {
  if (result.valid) {
    console.log('\nValidation: PASSED (no errors)');
  } else {
    console.log(`\nValidation: FAILED (${result.errors.length} error(s))`);
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
}

// ─── Database Insertion ────────────────────────────────────────────────────────

async function insertScene(
  sql: NeonQueryFunction<false, false>,
  scene: GeneratedScene,
  pathId: string,
  languageId: string
): Promise<void> {
  // 1. Get next sort_order for this path
  const sortRows = await sql`SELECT COALESCE(MAX(sort_order), 0)::int AS max_sort FROM scenes WHERE path_id = ${pathId}`;
  const nextSort = (sortRows[0] as { max_sort: number }).max_sort + 1;

  // 2. Create scene
  const sceneId = randomUUID();
  await sql`
    INSERT INTO scenes (id, path_id, title, description, scene_type, scene_context, sort_order)
    VALUES (${sceneId}, ${pathId}, ${scene.title}, ${scene.description}, 'dialogue', ${scene.scene_context}, ${nextSort})
  `;
  console.log(`  Scene: ${scene.title} (sort_order: ${nextSort})`);

  // 3. Insert words + mnemonics (with proper existing word handling)
  let pathWordSort = 0;
  const sortRes = await sql`SELECT COALESCE(MAX(sort_order), 0)::int AS max_sort FROM path_words WHERE path_id = ${pathId}`;
  pathWordSort = (sortRes[0] as { max_sort: number }).max_sort;

  for (let i = 0; i < scene.words.length; i++) {
    const w = scene.words[i];
    const newId = randomUUID();

    // Upsert word: if it already exists, update updated_at and return the existing id
    const wordRows = await sql`
      INSERT INTO words (id, language_id, text, romanization, meaning_en, part_of_speech)
      VALUES (${newId}, ${languageId}, ${w.text}, ${w.romanization}, ${w.meaning_en}, ${w.part_of_speech})
      ON CONFLICT (language_id, text)
      DO UPDATE SET updated_at = NOW()
      RETURNING id
    `;
    const wordId = (wordRows[0] as { id: string }).id;
    const isExisting = wordId !== newId;

    await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES (${sceneId}, ${wordId}, ${i + 1}) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO path_words (path_id, word_id, sort_order) VALUES (${pathId}, ${wordId}, ${++pathWordSort}) ON CONFLICT DO NOTHING`;

    // Insert mnemonic
    const mnemonic = scene.mnemonics.find(m => m.word_text === w.text);
    if (mnemonic) {
      await sql`
        INSERT INTO mnemonics (word_id, keyword_text, scene_description, bridge_sentence)
        VALUES (${wordId}, ${mnemonic.keyword_text}, ${mnemonic.scene_description}, ${mnemonic.bridge_sentence})
      `;
    }

    const tag = isExisting ? ' (existing)' : '';
    console.log(`  Word: ${w.text} -> ${w.meaning_en}${tag}`);
  }

  // 4. Insert dialogues
  for (let i = 0; i < scene.dialogues.length; i++) {
    const d = scene.dialogues[i];
    await sql`
      INSERT INTO scene_dialogues (scene_id, sort_order, speaker, text_target, text_en)
      VALUES (${sceneId}, ${i + 1}, ${d.speaker}, ${d.text_target}, ${d.text_en})
    `;
  }

  // 5. Insert phrases
  for (let i = 0; i < scene.phrases.length; i++) {
    const p = scene.phrases[i];
    await sql`
      INSERT INTO scene_phrases (scene_id, sort_order, text_target, text_en, literal_translation, usage_note)
      VALUES (${sceneId}, ${i + 1}, ${p.text_target}, ${p.text_en}, ${p.literal_translation}, ${p.usage_note})
    `;
  }

  // 6. Insert pattern exercises
  if (scene.patterns && scene.patterns.length > 0) {
    for (let i = 0; i < scene.patterns.length; i++) {
      const p = scene.patterns[i];
      await sql`
        INSERT INTO scene_pattern_exercises (scene_id, pattern_template, pattern_en, explanation, prompt, hint_en, correct_answer, distractors, exercise_type, sort_order)
        VALUES (${sceneId}, ${p.pattern_template}, ${p.pattern_en}, ${p.explanation}, ${p.prompt}, ${p.hint_en}, ${p.correct_answer}, ${p.distractors}, ${p.exercise_type}, ${i + 1})
      `;
    }
    console.log(`  Patterns: ${scene.patterns.length} exercises inserted`);
  }

  console.log(`\nDone! Scene "${scene.title}" added to path ${pathId}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, ...rest] = a.split('=');
      return [k.replace(/^--/, ''), rest.join('=') || 'true'];
    })
  );

  const hasBatch = !!args.batch;
  const hasTopic = !!args.topic;

  if (!hasBatch && !hasTopic) {
    console.log(USAGE);
    process.exit(1);
  }

  if (!args['path-id']) {
    console.error('Error: --path-id is required');
    console.log(USAGE);
    process.exit(1);
  }

  const languageName = args.language ?? 'Indonesian';
  const languageCode = args['lang-code'] ?? 'id';
  const languageId = args['lang-id'] ?? 'a1b2c3d4-0001-4000-8000-000000000001';
  const pathId = args['path-id'];
  const dryRun = args['dry-run'] === 'true';
  const globalGrammarFocus = args['grammar-focus'];

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

  // Build list of scenes to generate
  let sceneDefs: { topic: string; wordCount: number; grammarFocus?: string }[];

  if (hasBatch) {
    const batchPath = args.batch;
    let batchFile: BatchFile;
    try {
      const raw = readFileSync(batchPath, 'utf-8');
      batchFile = JSON.parse(raw) as BatchFile;
    } catch (err) {
      console.error(`Error reading batch file "${batchPath}":`, err);
      process.exit(1);
    }

    if (!batchFile.scenes || batchFile.scenes.length === 0) {
      console.error('Batch file has no scenes');
      process.exit(1);
    }

    sceneDefs = batchFile.scenes.map(s => ({
      topic: s.topic,
      wordCount: s.wordCount ?? parseInt(args['word-count'] ?? '10'),
      grammarFocus: s.grammarFocus ?? globalGrammarFocus,
    }));

    console.log(`Batch mode: ${sceneDefs.length} scene(s) to generate\n`);
  } else {
    sceneDefs = [{
      topic: args.topic,
      wordCount: parseInt(args['word-count'] ?? '10'),
      grammarFocus: globalGrammarFocus,
    }];
  }

  // Track cumulative words across batch scenes
  const cumulativeWords = [...existingWords];

  for (let si = 0; si < sceneDefs.length; si++) {
    const def = sceneDefs[si];
    const label = hasBatch ? `[${si + 1}/${sceneDefs.length}] ` : '';

    console.log(`${label}Generating scene: "${def.topic}" for ${languageName}...`);
    console.log(`${label}Excluding ${cumulativeWords.length} existing/previous words`);

    const scene = await generateScene(
      def.topic,
      languageName,
      languageCode,
      cumulativeWords,
      def.wordCount,
      def.grammarFocus
    );

    console.log(`${label}Generated: "${scene.title}"`);
    console.log(`${label}Words: ${scene.words.length}, Dialogues: ${scene.dialogues.length}, Phrases: ${scene.phrases.length}, Patterns: ${scene.patterns?.length ?? 0}`);

    // Add generated words to cumulative list for next scene
    for (const w of scene.words) {
      if (!cumulativeWords.includes(w.text)) {
        cumulativeWords.push(w.text);
      }
    }

    if (dryRun) {
      const validation = validateGeneratedScene(scene);
      printValidationResults(validation);
      printFormattedSummary(scene);
      continue;
    }

    // Validate before inserting
    const validation = validateGeneratedScene(scene);
    if (!validation.valid) {
      console.warn(`\n${label}Validation warnings (${validation.errors.length}):`);
      for (const err of validation.errors) {
        console.warn(`  - ${err}`);
      }
      console.warn(`${label}Proceeding with insertion despite warnings...\n`);
    }

    console.log(`\n${label}Inserting into database...`);
    await insertScene(sql!, scene, pathId, languageId);

    if (si < sceneDefs.length - 1) {
      console.log('\n' + '-'.repeat(40) + '\n');
    }
  }

  if (hasBatch && !dryRun) {
    console.log(`\nBatch complete: ${sceneDefs.length} scene(s) generated and inserted.`);
  }
}

main().catch(console.error);
