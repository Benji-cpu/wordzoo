import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { DIALOGUE_SCENES } from './dialogue-data';

const ID_LANG = 'a1b2c3d4-0001-4000-8000-000000000001';
const ID_PATH = 'c1000000-0001-4000-8000-000000000001';

async function seedDialogues() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  // Check which scenes to seed (pass --only=1 or --only=1,2,3 to limit)
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const onlyScenes = onlyArg
    ? onlyArg.split('=')[1].split(',').map(Number)
    : null;

  console.log('Seeding dialogue scenes...');

  try {
    // 1. Mark existing scenes as legacy (idempotent)
    console.log('Marking existing scenes as legacy...');
    await sql`UPDATE scenes SET scene_type = 'legacy' WHERE scene_type IS NULL OR scene_type = 'legacy'`;

    // 2. Get the current max path_words sort_order for the Indonesian path
    const maxSortRows = await sql`
      SELECT COALESCE(MAX(sort_order), 0)::int AS max_sort FROM path_words WHERE path_id = ${ID_PATH}
    `;
    let pathWordSort = (maxSortRows[0] as { max_sort: number }).max_sort;

    for (let i = 0; i < DIALOGUE_SCENES.length; i++) {
      const sceneNum = i + 1;
      if (onlyScenes && !onlyScenes.includes(sceneNum)) continue;

      const scene = DIALOGUE_SCENES[i];
      console.log(`\nSeeding Scene ${sceneNum}: ${scene.title}...`);

      // 3. Upsert scene (hardcoded ID ensures ON CONFLICT triggers on re-run)
      const sceneRows = await sql`
        INSERT INTO scenes (id, path_id, title, description, scene_type, scene_context, sort_order)
        VALUES (${scene.id}, ${ID_PATH}, ${scene.title}, ${scene.description}, 'dialogue', ${scene.scene_context}, ${scene.sort_order})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          scene_context = EXCLUDED.scene_context,
          sort_order = EXCLUDED.sort_order
        RETURNING id
      `;
      const sceneId = (sceneRows[0] as { id: string }).id;
      console.log(`  Scene ID: ${sceneId}`);

      // 4. Insert new words (hardcoded IDs)
      const wordIdMap = new Map<string, string>(); // text -> id
      for (const nw of scene.newWords) {
        await sql`
          INSERT INTO words (id, language_id, text, meaning_en, part_of_speech)
          VALUES (${nw.id}, ${ID_LANG}, ${nw.text}, ${nw.meaning_en}, ${nw.part_of_speech})
          ON CONFLICT (id) DO UPDATE SET
            meaning_en = EXCLUDED.meaning_en,
            part_of_speech = EXCLUDED.part_of_speech
        `;
        wordIdMap.set(nw.text, nw.id);
        console.log(`  Word "${nw.text}": ${nw.id}`);
      }

      // Also look up existing word IDs
      for (const text of scene.existingWordTexts) {
        if (!wordIdMap.has(text)) {
          const rows = await sql`
            SELECT id FROM words WHERE text = ${text} AND language_id = ${ID_LANG} LIMIT 1
          `;
          if (rows.length > 0) {
            wordIdMap.set(text, (rows[0] as { id: string }).id);
          } else {
            console.warn(`  Warning: existing word "${text}" not found`);
          }
        }
      }

      // 5. Link words to scene_words and path_words
      const allWordTexts = [...scene.newWords.map((w) => w.text), ...scene.existingWordTexts];
      let sceneWordSort = 0;
      for (const text of allWordTexts) {
        const wordId = wordIdMap.get(text);
        if (!wordId) continue;
        sceneWordSort++;
        await sql`
          INSERT INTO scene_words (scene_id, word_id, sort_order)
          VALUES (${sceneId}, ${wordId}, ${sceneWordSort})
          ON CONFLICT DO NOTHING
        `;
        // Only add new words to path_words (existing ones are already there)
        if (scene.newWords.some((nw) => nw.text === text)) {
          pathWordSort++;
          await sql`
            INSERT INTO path_words (path_id, word_id, sort_order)
            VALUES (${ID_PATH}, ${wordId}, ${pathWordSort})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      // 6. Insert dialogue lines (hardcoded IDs)
      console.log(`  Inserting ${scene.dialogues.length} dialogue lines...`);
      for (let d = 0; d < scene.dialogues.length; d++) {
        const dl = scene.dialogues[d];
        await sql`
          INSERT INTO scene_dialogues (id, scene_id, speaker, text_target, text_en, sort_order)
          VALUES (${dl.id}, ${sceneId}, ${dl.speaker}, ${dl.text_target}, ${dl.text_en}, ${d + 1})
          ON CONFLICT (id) DO UPDATE SET
            speaker = EXCLUDED.speaker,
            text_target = EXCLUDED.text_target,
            text_en = EXCLUDED.text_en,
            sort_order = EXCLUDED.sort_order
        `;
      }

      // 7. Insert phrases and phrase_words (hardcoded IDs)
      console.log(`  Inserting ${scene.phrases.length} phrases...`);
      for (let p = 0; p < scene.phrases.length; p++) {
        const ph = scene.phrases[p];
        await sql`
          INSERT INTO scene_phrases (id, scene_id, text_target, text_en, literal_translation, usage_note, sort_order)
          VALUES (${ph.id}, ${sceneId}, ${ph.text_target}, ${ph.text_en}, ${ph.literal_translation}, ${ph.usage_note}, ${p + 1})
          ON CONFLICT (id) DO UPDATE SET
            text_target = EXCLUDED.text_target,
            text_en = EXCLUDED.text_en,
            literal_translation = EXCLUDED.literal_translation,
            usage_note = EXCLUDED.usage_note,
            sort_order = EXCLUDED.sort_order
        `;

        // Link phrase to words
        for (let w = 0; w < ph.wordTexts.length; w++) {
          const wordId = wordIdMap.get(ph.wordTexts[w]);
          if (wordId) {
            await sql`
              INSERT INTO phrase_words (phrase_id, word_id, position)
              VALUES (${ph.id}, ${wordId}, ${w + 1})
              ON CONFLICT DO NOTHING
            `;
          }
        }
      }

      // 8. Insert pattern exercises (hardcoded IDs)
      console.log(`  Inserting ${scene.patterns.length} pattern exercises...`);
      for (let pe = 0; pe < scene.patterns.length; pe++) {
        const pat = scene.patterns[pe];
        await sql`
          INSERT INTO scene_pattern_exercises (id, scene_id, pattern_template, pattern_en, explanation, prompt, hint_en, correct_answer, distractors, sort_order)
          VALUES (${pat.id}, ${sceneId}, ${pat.pattern_template}, ${pat.pattern_en}, ${pat.explanation}, ${pat.prompt}, ${pat.hint_en}, ${pat.correct_answer}, ${pat.distractors}, ${pe + 1})
          ON CONFLICT (id) DO UPDATE SET
            pattern_template = EXCLUDED.pattern_template,
            pattern_en = EXCLUDED.pattern_en,
            explanation = EXCLUDED.explanation,
            prompt = EXCLUDED.prompt,
            hint_en = EXCLUDED.hint_en,
            correct_answer = EXCLUDED.correct_answer,
            distractors = EXCLUDED.distractors,
            sort_order = EXCLUDED.sort_order
        `;
      }

      console.log(`  Scene ${sceneNum} seeded: ${sceneId}`);
    }

    console.log('\nDialogue scene seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDialogues();
