import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { generateChatJSON } from '../ai/gemini';

interface SceneRow {
  id: string;
  title: string;
  description: string | null;
  scene_context: string | null;
  language_code: string;
  language_name: string;
  path_title: string;
}

interface SceneWordRow {
  text: string;
  romanization: string | null;
  meaning_en: string;
}

interface ScenePhraseRow {
  text_target: string;
  text_en: string;
}

interface GeneratedPrompt {
  prompt: string;
  en: string;
}

const DEFAULT_PROMPT_COUNT = 8;
const MIN_KEEP_THRESHOLD = 6;

function parseFlag(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, '');
}

function buildScenePromptBankPrompt(
  scene: SceneRow,
  words: SceneWordRow[],
  phrases: ScenePhraseRow[],
  count: number
): string {
  const wordList = words
    .map((w) => `- ${w.text}${w.romanization ? ` (${w.romanization})` : ''} = ${w.meaning_en}`)
    .join('\n');
  const phraseList = phrases
    .map((p) => `- ${p.text_target} = ${p.text_en}`)
    .join('\n');

  return `You are designing autobiographical conversation prompts that a language tutor will use to make a student practice the vocabulary and grammar of a specific scene.

Scene title: ${scene.title}
Scene context: ${scene.scene_context ?? scene.description ?? '(none)'}
Path: ${scene.path_title}
Target language: ${scene.language_name} (code: ${scene.language_code})

Vocabulary the student just learned in this scene:
${wordList || '(none)'}

Key phrases the student just learned in this scene:
${phraseList || '(none)'}

Generate ${count} short, autobiographical conversation questions in ${scene.language_name}.

Requirements:
- Questions must be ABOUT THE STUDENT — their life, habits, memories, preferences, opinions. Not abstract or hypothetical.
- Each question should naturally pull at least one of the scene's vocabulary words or grammatical structures into the answer.
- Use only target-language vocabulary the student is likely to know at this point — prefer the scene's vocab and obvious cognates/high-frequency function words. Avoid introducing complex new words.
- Mix concrete (where, when, what, with whom) and reflective (do you prefer, did you ever, what do you think) angles.
- Questions should be 5–12 words long. Conversational register.
- No greetings, no preambles. Just the question.
- Avoid duplicate angles — each question should target a different facet of the scene.

Return strictly as JSON of this shape:
{
  "prompts": [
    { "prompt": "<question in ${scene.language_name}>", "en": "<English gloss>" }
  ]
}`;
}

async function generatePrompts(
  scene: SceneRow,
  words: SceneWordRow[],
  phrases: ScenePhraseRow[],
  count: number
): Promise<GeneratedPrompt[]> {
  const userPrompt = buildScenePromptBankPrompt(scene, words, phrases, count);
  const { data } = await generateChatJSON<{ prompts: GeneratedPrompt[] }>(
    [{ role: 'user', content: userPrompt }],
    'You are a language pedagogy assistant. Always return strictly valid JSON matching the requested shape. Output ONLY the JSON object, no markdown, no commentary.',
    { maxOutputTokens: 4096 }
  );
  if (!Array.isArray(data?.prompts)) {
    throw new Error('Gemini returned malformed response (missing prompts array)');
  }
  return data.prompts.filter(
    (p) => typeof p?.prompt === 'string' && p.prompt.trim().length > 0
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  const langFilter = parseFlag('language');
  const pathFilter = parseFlag('path');
  const sceneFilter = parseFlag('scene');
  const limit = parseFlag('limit');
  const countArg = parseFlag('count');
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const count = countArg ? parseInt(countArg, 10) : DEFAULT_PROMPT_COUNT;

  console.log('=== Seeding Scene Conversation Prompts ===');
  console.log(`Filters: language=${langFilter ?? 'all'}, path=${pathFilter ?? 'all'}, scene=${sceneFilter ?? 'all'}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}, force=${force}, count=${count}`);
  console.log('');

  // Build scenes query with optional filters. Tagged-template SQL doesn't
  // splice variable WHERE clauses cleanly, so we filter in memory.
  let scenes = (await sql`
    SELECT s.id, s.title, s.description, s.scene_context,
           l.code AS language_code, l.name AS language_name,
           p.id AS path_id, p.title AS path_title, l.id AS language_id
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    ORDER BY l.name, p.title, s.sort_order
  `) as (SceneRow & { path_id: string; language_id: string })[];

  if (langFilter) scenes = scenes.filter((s) => s.language_code === langFilter || s.language_id === langFilter);
  if (pathFilter) scenes = scenes.filter((s) => s.path_id === pathFilter);
  if (sceneFilter) scenes = scenes.filter((s) => s.id === sceneFilter);
  if (limit) scenes = scenes.slice(0, parseInt(limit, 10));

  console.log(`Matched ${scenes.length} scene(s)\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const tag = `[${i + 1}/${scenes.length}]`;
    console.log(`${tag} ${scene.language_name} / ${scene.path_title} / ${scene.title}`);

    const existing = (await sql`
      SELECT COUNT(*)::int AS count FROM scene_conversation_prompts WHERE scene_id = ${scene.id}
    `) as { count: number }[];
    const existingCount = existing[0]?.count ?? 0;

    if (existingCount >= MIN_KEEP_THRESHOLD && !force) {
      console.log(`  Skipping — ${existingCount} prompt(s) already exist (use --force to overwrite)`);
      skipped++;
      continue;
    }

    const wordsRaw = await sql`
      SELECT w.text, w.romanization, w.meaning_en
      FROM scene_words sw
      JOIN words w ON w.id = sw.word_id
      WHERE sw.scene_id = ${scene.id}
      ORDER BY sw.sort_order
    `;
    const phrasesRaw = await sql`
      SELECT text_target, text_en
      FROM scene_phrases
      WHERE scene_id = ${scene.id}
      ORDER BY sort_order
    `;
    const words = wordsRaw as unknown as SceneWordRow[];
    const phrases = phrasesRaw as unknown as ScenePhraseRow[];

    if (words.length === 0 && phrases.length === 0) {
      console.log(`  Skipping — scene has no words or phrases`);
      skipped++;
      continue;
    }

    let prompts: GeneratedPrompt[];
    try {
      prompts = await generatePrompts(scene, words, phrases, count);
    } catch (err) {
      console.error(`  ✗ Generation failed: ${err instanceof Error ? err.message : err}`);
      failed++;
      continue;
    }

    if (prompts.length === 0) {
      console.log(`  ✗ Gemini returned 0 prompts`);
      failed++;
      continue;
    }

    console.log(`  Generated ${prompts.length} prompt(s):`);
    prompts.forEach((p, idx) => console.log(`    ${idx + 1}. ${p.prompt}${p.en ? `  [${p.en}]` : ''}`));

    if (dryRun) {
      generated++;
      continue;
    }

    if (existingCount > 0 && force) {
      await sql`DELETE FROM scene_conversation_prompts WHERE scene_id = ${scene.id}`;
    }

    for (let j = 0; j < prompts.length; j++) {
      const p = prompts[j];
      await sql`
        INSERT INTO scene_conversation_prompts (scene_id, prompt_text, prompt_en, sort_order, source)
        VALUES (${scene.id}, ${p.prompt.trim()}, ${p.en?.trim() ?? null}, ${j}, 'ai_generated')
      `;
    }
    generated++;
  }

  console.log('');
  console.log(`=== Done ===`);
  console.log(`Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
