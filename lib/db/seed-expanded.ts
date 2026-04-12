import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { ALL_EXPANDED_SCENES } from './expanded';

const ID_LANG = 'a1b2c3d4-0001-4000-8000-000000000001';
const ID_PATH = 'c1000000-0001-4000-8000-000000000001';

// Curriculum sort_order updates for existing scenes
// Maps scene ID → new sort_order to align with curriculum unit structure
const SORT_ORDER_UPDATES: Record<string, number> = {
  // Selamat Pagi: already sort_order 1 — no change
  // Nama Saya: already sort_order 2 — no change
  'd1000000-0001-4000-8000-000000000009': 6,   // Di Mana → Unit 2 slot 2.1
  'd1000000-0001-4000-8000-000000000006': 11,  // Saya Mau → Unit 3 slot 3.1
  'd1000000-0001-4000-8000-000000000008': 12,  // Enak Sekali → Unit 3 slot 3.2
  'd1000000-0001-4000-8000-000000000007': 16,  // Berapa Harganya → Unit 4 slot 4.1
  'd1000000-0001-4000-8000-000000000005': 26,  // Siapa Itu → Unit 6 slot 6.1
};

/**
 * Seeds expanded Indonesian content (Units 1-5, 19 new scenes, ~220 new words).
 * Uses the same upsert pattern as seed-dialogues.ts for idempotent re-runs.
 */
export async function seedExpandedContent(sql: NeonQueryFunction<false, false>) {
  // 1. Update existing scene sort_orders to match curriculum
  console.log('Updating existing scene sort_orders for curriculum alignment...');
  for (const [sceneId, newSort] of Object.entries(SORT_ORDER_UPDATES)) {
    await sql`UPDATE scenes SET sort_order = ${newSort} WHERE id = ${sceneId}`;
    console.log(`  Scene ${sceneId} → sort_order ${newSort}`);
  }

  // 2. Get the current max path_words sort_order for the Indonesian path
  const maxSortRows = await sql`
    SELECT COALESCE(MAX(sort_order), 0)::int AS max_sort FROM path_words WHERE path_id = ${ID_PATH}
  `;
  let pathWordSort = (maxSortRows[0] as { max_sort: number }).max_sort;

  // 3. Seed each expanded scene
  for (let i = 0; i < ALL_EXPANDED_SCENES.length; i++) {
    const scene = ALL_EXPANDED_SCENES[i];
    console.log(`\n[${i + 1}/${ALL_EXPANDED_SCENES.length}] Seeding: ${scene.title}...`);

    // Upsert scene
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

    // Insert new words
    const wordIdMap = new Map<string, string>();
    for (const nw of scene.newWords) {
      await sql`
        INSERT INTO words (id, language_id, text, meaning_en, part_of_speech)
        VALUES (${nw.id}, ${ID_LANG}, ${nw.text}, ${nw.meaning_en}, ${nw.part_of_speech})
        ON CONFLICT (id) DO UPDATE SET
          text = EXCLUDED.text,
          meaning_en = EXCLUDED.meaning_en,
          part_of_speech = EXCLUDED.part_of_speech
      `;
      wordIdMap.set(nw.text, nw.id);
    }
    console.log(`  ${scene.newWords.length} words upserted`);

    // Look up existing word IDs
    for (const text of scene.existingWordTexts) {
      if (!wordIdMap.has(text)) {
        const rows = await sql`
          SELECT id FROM words WHERE text = ${text} AND language_id = ${ID_LANG} LIMIT 1
        `;
        if (rows.length > 0) {
          wordIdMap.set(text, (rows[0] as { id: string }).id);
        } else {
          console.warn(`  Warning: existing word "${text}" not found in DB`);
        }
      }
    }

    // Link words to scene_words and path_words
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
      if (scene.newWords.some((nw) => nw.text === text)) {
        pathWordSort++;
        await sql`
          INSERT INTO path_words (path_id, word_id, sort_order)
          VALUES (${ID_PATH}, ${wordId}, ${pathWordSort})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    // Insert dialogue lines
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
    console.log(`  ${scene.dialogues.length} dialogues`);

    // Insert phrases and phrase_words
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
    console.log(`  ${scene.phrases.length} phrases`);

    // Insert pattern exercises
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
    console.log(`  ${scene.patterns.length} patterns`);
  }

  console.log(`\nExpanded content seeding complete! ${ALL_EXPANDED_SCENES.length} scenes seeded.`);
}

// Allow standalone execution: `npx tsx lib/db/seed-expanded.ts`
const isDirectRun = process.argv[1]?.endsWith('seed-expanded.ts');
if (isDirectRun) {
  (async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }

    const sql = neon(databaseUrl);
    console.log('Seeding expanded Indonesian content (Units 1-5)...\n');

    try {
      await seedExpandedContent(sql);
    } catch (error) {
      console.error('Seeding failed:', error);
      process.exit(1);
    }
  })();
}
