/**
 * Content Library Import Script
 *
 * Loads language JSON files into the database.
 * Run with: npx tsx data/import.ts
 *
 * - Idempotent (safe to re-run via ON CONFLICT clauses)
 * - Deduplicates words by text + language_id
 * - Creates paths for each tier + each travel pack
 * - Creates scenes within paths with narrative_setup and sort_order
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v5 as uuidv5 } from 'uuid';

// Namespace UUID for deterministic ID generation
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// Language UUIDs matching seed.ts
const LANGUAGE_IDS: Record<string, string> = {
  id: 'a1b2c3d4-0001-4000-8000-000000000001',
  es: 'a1b2c3d4-0001-4000-8000-000000000002',
  ja: 'a1b2c3d4-0001-4000-8000-000000000003',
};

const LANGUAGE_NATIVE_NAMES: Record<string, string> = {
  id: 'Bahasa Indonesia',
  es: 'Español',
  ja: '日本語',
};

interface WordEntry {
  text: string;
  romanization: string | null;
  meaning: string;
  part_of_speech: string;
  frequency_rank: number;
  sample_sentence: string;
  is_phrase: boolean;
}

interface SceneEntry {
  title: string;
  narrative: string;
  words: WordEntry[];
}

interface TierEntry {
  tier: number;
  name: string;
  scenes: SceneEntry[];
}

interface TravelPackEntry {
  title: string;
  situations: SceneEntry[];
}

interface LanguageFile {
  language: string;
  language_code: string;
  tiers: TierEntry[];
  travel_packs: TravelPackEntry[];
}

/** Generate a deterministic UUID from a string key */
function deterministicId(key: string): string {
  return uuidv5(key, NAMESPACE);
}

async function importLanguage(
  sql: ReturnType<typeof neon>,
  filePath: string
): Promise<{ words: number; scenes: number; paths: number }> {
  const raw = readFileSync(filePath, 'utf-8');
  const data: LanguageFile = JSON.parse(raw);
  const langCode = data.language_code;
  const langId = LANGUAGE_IDS[langCode];

  if (!langId) {
    throw new Error(`Unknown language code: ${langCode}`);
  }

  console.log(`\n--- Importing ${data.language} (${langCode}) ---`);

  // Ensure language exists
  await sql`
    INSERT INTO languages (id, code, name, native_name)
    VALUES (${langId}, ${langCode}, ${data.language}, ${LANGUAGE_NATIVE_NAMES[langCode]})
    ON CONFLICT (code) DO NOTHING
  `;

  // Track word IDs for deduplication: text -> word_id
  const wordIdMap = new Map<string, string>();
  let totalWords = 0;
  let totalScenes = 0;
  let totalPaths = 0;

  // --- Import Tiers ---
  for (const tier of data.tiers) {
    const pathId = deterministicId(`path:${langCode}:tier${tier.tier}`);
    const pathTitle = `${tier.name} ${data.language}`;
    const pathDesc = `${tier.name} tier: ${tier.scenes.length} scenes for ${data.language}`;

    await sql`
      INSERT INTO paths (id, language_id, type, title, description)
      VALUES (${pathId}, ${langId}, 'premade', ${pathTitle}, ${pathDesc})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description
    `;
    totalPaths++;

    let sceneOrder = 0;
    let wordOrderInPath = 0;

    for (const scene of tier.scenes) {
      sceneOrder++;
      const sceneId = deterministicId(`scene:${langCode}:tier${tier.tier}:${scene.title}`);

      await sql`
        INSERT INTO scenes (id, path_id, title, description, sort_order)
        VALUES (${sceneId}, ${pathId}, ${scene.title}, ${scene.narrative}, ${sceneOrder})
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order
      `;
      totalScenes++;

      let wordOrderInScene = 0;

      for (const word of scene.words) {
        wordOrderInScene++;
        wordOrderInPath++;

        // Check if word already exists (dedup by text + language)
        let wordId = wordIdMap.get(word.text);

        if (!wordId) {
          wordId = deterministicId(`word:${langCode}:${word.text}`);
          wordIdMap.set(word.text, wordId);

          // Insert the word
          if (word.is_phrase) {
            // Insert as both a word entry and a phrase
            // Use the first word as the "parent" word for phrase linking
            await sql`
              INSERT INTO words (id, language_id, text, romanization, meaning_en, part_of_speech, frequency_rank)
              VALUES (${wordId}, ${langId}, ${word.text}, ${word.romanization}, ${word.meaning}, ${word.part_of_speech}, ${word.frequency_rank})
              ON CONFLICT (id) DO UPDATE SET meaning_en = EXCLUDED.meaning_en, frequency_rank = EXCLUDED.frequency_rank
            `;
          } else {
            await sql`
              INSERT INTO words (id, language_id, text, romanization, meaning_en, part_of_speech, frequency_rank)
              VALUES (${wordId}, ${langId}, ${word.text}, ${word.romanization}, ${word.meaning}, ${word.part_of_speech}, ${word.frequency_rank})
              ON CONFLICT (id) DO UPDATE SET meaning_en = EXCLUDED.meaning_en, frequency_rank = EXCLUDED.frequency_rank
            `;
          }
          totalWords++;
        }

        // Link word to scene
        await sql`
          INSERT INTO scene_words (scene_id, word_id, sort_order)
          VALUES (${sceneId}, ${wordId}, ${wordOrderInScene})
          ON CONFLICT (scene_id, word_id) DO UPDATE SET sort_order = EXCLUDED.sort_order
        `;

        // Link word to path
        await sql`
          INSERT INTO path_words (path_id, word_id, sort_order)
          VALUES (${pathId}, ${wordId}, ${wordOrderInPath})
          ON CONFLICT (path_id, word_id) DO UPDATE SET sort_order = EXCLUDED.sort_order
        `;
      }
    }

    console.log(`  Tier ${tier.tier} "${tier.name}": ${tier.scenes.length} scenes imported`);
  }

  // --- Import Travel Packs ---
  for (const pack of data.travel_packs) {
    const pathId = deterministicId(`travel:${langCode}:${pack.title}`);

    await sql`
      INSERT INTO paths (id, language_id, type, title, description)
      VALUES (${pathId}, ${langId}, 'travel', ${pack.title}, ${'Travel pack: ' + pack.title})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description
    `;
    totalPaths++;

    let sceneOrder = 0;
    let wordOrderInPath = 0;

    for (const situation of pack.situations) {
      sceneOrder++;
      const sceneId = deterministicId(`scene:${langCode}:travel:${pack.title}:${situation.title}`);

      await sql`
        INSERT INTO scenes (id, path_id, title, description, sort_order)
        VALUES (${sceneId}, ${pathId}, ${situation.title}, ${situation.narrative}, ${sceneOrder})
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order
      `;
      totalScenes++;

      let wordOrderInScene = 0;

      for (const word of situation.words) {
        wordOrderInScene++;
        wordOrderInPath++;

        // Dedup: reuse word ID if already inserted from tier data
        let wordId = wordIdMap.get(word.text);

        if (!wordId) {
          wordId = deterministicId(`word:${langCode}:${word.text}`);
          wordIdMap.set(word.text, wordId);

          await sql`
            INSERT INTO words (id, language_id, text, romanization, meaning_en, part_of_speech, frequency_rank)
            VALUES (${wordId}, ${langId}, ${word.text}, ${word.romanization}, ${word.meaning}, ${word.part_of_speech}, ${word.frequency_rank})
            ON CONFLICT (id) DO UPDATE SET meaning_en = EXCLUDED.meaning_en, frequency_rank = EXCLUDED.frequency_rank
          `;
          totalWords++;
        }

        // Link word to scene
        await sql`
          INSERT INTO scene_words (scene_id, word_id, sort_order)
          VALUES (${sceneId}, ${wordId}, ${wordOrderInScene})
          ON CONFLICT (scene_id, word_id) DO UPDATE SET sort_order = EXCLUDED.sort_order
        `;

        // Link word to path
        await sql`
          INSERT INTO path_words (path_id, word_id, sort_order)
          VALUES (${pathId}, ${wordId}, ${wordOrderInPath})
          ON CONFLICT (path_id, word_id) DO UPDATE SET sort_order = EXCLUDED.sort_order
        `;
      }
    }

    console.log(`  Travel pack "${pack.title}": ${pack.situations.length} situations imported`);
  }

  return { words: totalWords, scenes: totalScenes, paths: totalPaths };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.error('Set it with: export DATABASE_URL="postgresql://..."');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const dataDir = __dirname;

  const files = [
    join(dataDir, 'indonesian.json'),
    join(dataDir, 'spanish.json'),
    join(dataDir, 'japanese.json'),
  ];

  console.log('=== WordZoo Content Library Import ===');
  console.log(`Importing ${files.length} language files...`);

  let grandTotalWords = 0;
  let grandTotalScenes = 0;
  let grandTotalPaths = 0;

  for (const filePath of files) {
    try {
      const stats = await importLanguage(sql, filePath);
      grandTotalWords += stats.words;
      grandTotalScenes += stats.scenes;
      grandTotalPaths += stats.paths;
    } catch (error) {
      console.error(`Failed to import ${filePath}:`, error);
      process.exit(1);
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`  Total unique words: ${grandTotalWords}`);
  console.log(`  Total scenes: ${grandTotalScenes}`);
  console.log(`  Total paths: ${grandTotalPaths}`);
}

main();
