import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { generateChatJSON } from '../ai/gemini';

/**
 * Drafts can-do statements for every scene in a language and writes them to a
 * COMMITTED TypeScript file for hand-editing.
 *
 * Modelled on lib/db/seed-scene-prompts.ts, with two deliberate differences:
 *
 *  1. It writes lib/db/content/can-dos/<lang>.ts, not database rows. The
 *     statements are content — they belong in git, reviewable in a diff.
 *  2. It REFUSES to overwrite an existing file without --force. The hand-edit
 *     pass is the point of the pipeline; a re-run that silently discarded it
 *     would make the whole thing worthless. Use --scene=<id> to print a single
 *     entry to stdout for manual paste once the file has been edited.
 *
 * Run:
 *   npx tsx lib/db/generate-can-dos.ts --language=id --dry-run
 *   npx tsx lib/db/generate-can-dos.ts --language=id --limit=3
 *   npx tsx lib/db/generate-can-dos.ts --language=id --scene=<uuid>   # stdout only
 *   npx tsx lib/db/generate-can-dos.ts --language=id --append         # fill gaps
 *   npx tsx lib/db/generate-can-dos.ts --language=id --force          # overwrite
 *
 * --append is the one you want in practice. The Gemini free tier allows 20
 * requests per DAY, and there are 40 Indonesian scenes, so a full pass cannot
 * finish in one sitting. --append keeps every entry already in the file
 * (including hand-edits) and only generates for scenes that have none yet, so
 * you can run it across several days without losing work.
 */

interface SceneRow {
  id: string;
  title: string;
  description: string | null;
  scene_context: string | null;
  sort_order: number;
  language_code: string;
  language_name: string;
  language_id: string;
  path_id: string;
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

interface GeneratedCanDo {
  statement_en: string;
  prompt_en: string;
  reference_target: string;
  accept_notes?: string;
  must_include?: string[];
}

const MIN_PER_SCENE = 2;
const MAX_PER_SCENE = 4;

function parseFlag(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, '');
}

/**
 * Deterministic ids so re-seeding upserts instead of duplicating.
 *
 * The scene's LAST segment is the distinguishing one — every premade scene id
 * looks like d1000000-0001-4000-8000-0000000000NN, so keying off the second
 * segment (as the phrase convention does) collides across every scene in a
 * unit. The index goes in the second block instead, which caps us at 9999
 * can-dos per scene and we allow at most 4.
 */
function canDoId(sceneId: string, index: number): string {
  const tail = sceneId.split('-').pop() ?? '000000000000';
  return `c1000000-${String(index).padStart(4, '0')}-4000-8000-${tail}`;
}

function buildPrompt(
  scene: SceneRow,
  words: SceneWordRow[],
  phrases: ScenePhraseRow[]
): string {
  const wordList = words
    .map((w) => `- ${w.text}${w.romanization ? ` (${w.romanization})` : ''} = ${w.meaning_en}`)
    .join('\n');
  const phraseList = phrases.map((p) => `- ${p.text_target} = ${p.text_en}`).join('\n');

  return `You are writing CEFR-style "can-do" statements for a language course. Each one names a single communicative act the learner should be able to perform in the real world after this scene, and comes with a test that checks it.

Scene title: ${scene.title}
Scene situation: ${scene.scene_context ?? scene.description ?? '(none)'}
Target language: ${scene.language_name} (code: ${scene.language_code})

Vocabulary taught in this scene:
${wordList || '(none)'}

Phrases taught in this scene:
${phraseList || '(none)'}

Write ${MIN_PER_SCENE}-${MAX_PER_SCENE} can-dos for this scene.

Hard requirements:
- "statement_en" is first person, present tense, ONE communicative act:
  "I can ask a driver how much a ride costs." Not two acts joined by "and".
- A can-do is an ACT, not a lexeme. Never write "I can say <word>" or
  "I can use the word X".
- "prompt_en" is the test the learner sees. It must be a concrete SITUATION
  that asks them to produce something, e.g. "You're at a warung. You want the
  fried rice, but without chilli. Say it."
  CRITICAL: prompt_en must NOT contain the ${scene.language_name} answer, or any
  ${scene.language_name} word from it. The learner sees only this prompt and a
  text box — no hints, no word bank. If the answer is visible in the prompt the
  test measures nothing.
- "reference_target" is ONE natural ${scene.language_name} answer, using only
  vocabulary and phrases taught in this scene (listed above).
- "accept_notes" (optional) is a short English note on what other answers should
  also count — alternative word order, a shorter form, a politer variant.
- "must_include" is 0-2 ${scene.language_name} lemmas that ANY correct answer
  must contain. This is checked literally and mechanically, and a wrong entry
  rejects a valid answer with no appeal. If you are not certain every acceptable
  phrasing contains the word, return an EMPTY array. Empty is the safe default
  and is expected for most can-dos.
- Cover different acts across the ${MIN_PER_SCENE}-${MAX_PER_SCENE}; do not
  restate the same act at different politeness levels.

Return strictly as JSON of this shape:
{
  "canDos": [
    {
      "statement_en": "...",
      "prompt_en": "...",
      "reference_target": "...",
      "accept_notes": "...",
      "must_include": []
    }
  ]
}`;
}

async function generateForScene(
  scene: SceneRow,
  words: SceneWordRow[],
  phrases: ScenePhraseRow[]
): Promise<GeneratedCanDo[]> {
  const { data } = await generateChatJSON<{ canDos: GeneratedCanDo[] }>(
    [{ role: 'user', content: buildPrompt(scene, words, phrases) }],
    'You are a language pedagogy assistant. Always return strictly valid JSON matching the requested shape. Output ONLY the JSON object, no markdown, no commentary.',
    { maxOutputTokens: 4096 }
  );
  if (!Array.isArray(data?.canDos)) {
    throw new Error('Gemini returned malformed response (missing canDos array)');
  }
  return data.canDos
    .filter(
      (c) =>
        typeof c?.statement_en === 'string' &&
        c.statement_en.trim().length > 0 &&
        typeof c?.prompt_en === 'string' &&
        c.prompt_en.trim().length > 0 &&
        typeof c?.reference_target === 'string' &&
        c.reference_target.trim().length > 0
    )
    .slice(0, MAX_PER_SCENE);
}

/**
 * A generated prompt that leaks the answer is the single failure mode that
 * makes the whole test meaningless, so check for it here rather than trusting
 * the instruction. Flags rather than drops — the owner decides in the edit pass.
 */
function leaksAnswer(c: GeneratedCanDo): boolean {
  const prompt = c.prompt_en.toLowerCase();
  return c.reference_target
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((t) => t.length >= 4)
    .some((token) => prompt.includes(token));
}

function serialize(langCode: string, entries: (GeneratedCanDo & { id: string; sceneId: string; sort_order: number })[]): string {
  const body = entries
    .map(
      (e) => `  {
    id: '${e.id}',
    sceneId: '${e.sceneId}',
    statement_en: ${JSON.stringify(e.statement_en.trim())},
    prompt_en: ${JSON.stringify(e.prompt_en.trim())},
    reference_target: ${JSON.stringify(e.reference_target.trim())},${
      e.accept_notes ? `\n    accept_notes: ${JSON.stringify(e.accept_notes.trim())},` : ''
    }
    // Model suggested: ${JSON.stringify(e.must_include ?? [])} — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: ${e.sort_order},
  },`
    )
    .join('\n');

  return `// AI-drafted by lib/db/generate-can-dos.ts. HAND-EDIT THIS FILE.
//
// The generator will not overwrite it without --force, because this editing
// pass is the point: the model is good at proposing communicative acts and
// unreliable at must_include and at keeping the answer out of prompt_en.
//
// Checklist when editing:
//   - prompt_en must not contain the target-language answer or any of its words
//   - must_include ships EMPTY on purpose. The model over-populates it, and a
//     wrong lemma rejects a valid answer before the grader ever runs, with no
//     appeal. The model's suggestion is left in a comment above each entry —
//     opt in deliberately, don't accept it wholesale.
//   - reference_target should use only vocabulary taught in that scene
//
// Seed with: npx tsx lib/db/seed-can-dos.ts --language=${langCode}
import type { CanDoData } from './types';

export const ${langCode.toUpperCase()}_CAN_DOS: CanDoData[] = [
${body}
];
`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  const langFilter = parseFlag('language') ?? 'id';
  const sceneFilter = parseFlag('scene');
  const limit = parseFlag('limit');
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const append = process.argv.includes('--append');

  const outPath = join(process.cwd(), 'lib/db/content/can-dos', `${langFilter}.ts`);
  const fileExists = existsSync(outPath);

  // Single-scene mode prints to stdout and never touches the file — that's the
  // incremental path once the file has been hand-edited.
  const stdoutOnly = Boolean(sceneFilter);

  if (fileExists && !force && !append && !dryRun && !stdoutOnly) {
    console.error(`Refusing to overwrite ${outPath}.`);
    console.error('That file has probably been hand-edited, and hand-edits are the source of truth.');
    console.error('Use --append to fill in scenes that have no can-dos yet (keeps everything already there),');
    console.error('--force to regenerate wholesale, or --scene=<uuid> to print one entry for manual paste.');
    process.exit(1);
  }

  // Existing entries are preserved verbatim in --append mode. Re-serializing
  // them loses the "model suggested" comments, but the data — including every
  // hand-edit — round-trips intact.
  let existing: (GeneratedCanDo & { id: string; sceneId: string; sort_order: number })[] = [];
  if (append && fileExists) {
    const mod = (await import(outPath)) as Record<string, unknown>;
    const arr = mod[`${langFilter.toUpperCase()}_CAN_DOS`];
    if (Array.isArray(arr)) {
      existing = arr as typeof existing;
      console.log(`Loaded ${existing.length} existing can-do(s) from ${langFilter}.ts`);
    }
  }
  const coveredScenes = new Set(existing.map((e) => e.sceneId));

  console.log('=== Generating can-do statements ===');
  console.log(`Language: ${langFilter}, scene=${sceneFilter ?? 'all'}, limit=${limit ?? 'none'}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : stdoutOnly ? 'STDOUT ONLY' : 'WRITE FILE'}, force=${force}`);
  console.log('');

  let scenes = (await sql`
    SELECT s.id, s.title, s.description, s.scene_context, s.sort_order,
           l.code AS language_code, l.name AS language_name, l.id AS language_id,
           p.id AS path_id, p.title AS path_title
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    WHERE p.type = 'premade'
    ORDER BY p.title, s.sort_order
  `) as SceneRow[];

  scenes = scenes.filter((s) => s.language_code === langFilter);
  if (sceneFilter) scenes = scenes.filter((s) => s.id === sceneFilter);
  if (append) {
    const before = scenes.length;
    scenes = scenes.filter((s) => !coveredScenes.has(s.id));
    console.log(`Append mode: skipping ${before - scenes.length} scene(s) that already have can-dos`);
  }
  if (limit) scenes = scenes.slice(0, parseInt(limit, 10));

  console.log(`Matched ${scenes.length} scene(s)\n`);

  const all: (GeneratedCanDo & { id: string; sceneId: string; sort_order: number })[] = [...existing];
  let failed = 0;
  let quotaExhausted = false;
  let flagged = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const tag = `[${i + 1}/${scenes.length}]`;
    console.log(`${tag} ${scene.title}`);

    const words = (await sql`
      SELECT w.text, w.romanization, w.meaning_en
      FROM scene_words sw JOIN words w ON w.id = sw.word_id
      WHERE sw.scene_id = ${scene.id} ORDER BY sw.sort_order
    `) as unknown as SceneWordRow[];
    const phrases = (await sql`
      SELECT text_target, text_en FROM scene_phrases
      WHERE scene_id = ${scene.id} ORDER BY sort_order
    `) as unknown as ScenePhraseRow[];

    if (words.length === 0 && phrases.length === 0) {
      console.log('  Skipping — scene has no words or phrases');
      continue;
    }

    let canDos: GeneratedCanDo[];
    try {
      canDos = await generateForScene(scene, words, phrases);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // The free tier allows 20 requests per DAY. Once that's gone every
      // remaining scene fails identically, so stop rather than printing the
      // same wall of JSON 28 more times — and keep whatever we did generate.
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('"code":429')) {
        console.error('  ✗ Gemini quota exhausted — stopping here.');
        console.error('    Re-run with --append tomorrow to pick up the remaining scenes.');
        quotaExhausted = true;
        break;
      }
      console.error(`  ✗ Generation failed: ${msg}`);
      failed++;
      continue;
    }

    if (canDos.length < MIN_PER_SCENE) {
      console.log(`  ⚠ Only ${canDos.length} returned (wanted >= ${MIN_PER_SCENE})`);
    }

    canDos.forEach((c, idx) => {
      const leak = leaksAnswer(c);
      if (leak) flagged++;
      console.log(`    ${idx + 1}. ${c.statement_en}`);
      console.log(`       prompt: ${c.prompt_en}${leak ? '   ⚠ MAY LEAK THE ANSWER — check this one' : ''}`);
      console.log(`       ref:    ${c.reference_target}`);
      if (c.must_include?.length) console.log(`       must:   ${c.must_include.join(', ')}`);
      all.push({ ...c, id: canDoId(scene.id, idx), sceneId: scene.id, sort_order: idx });
    });
  }

  console.log('');
  console.log(
    `=== Done === ${all.length} can-do(s) total across ${new Set(all.map((c) => c.sceneId)).size} scene(s), ` +
      `${failed} failed, ${flagged} flagged for answer leakage` +
      (quotaExhausted ? ' — STOPPED EARLY ON QUOTA' : '')
  );
  if (quotaExhausted) {
    console.log('Partial output is still written. Run again with --append when the quota resets.');
  }

  if (all.length === 0) return;

  const source = serialize(langFilter, all);

  if (dryRun) {
    console.log('\n--- DRY RUN, would write: ---\n');
    console.log(source);
    return;
  }

  if (stdoutOnly) {
    console.log('\n--- paste into lib/db/content/can-dos/' + langFilter + '.ts: ---\n');
    console.log(source);
    return;
  }

  writeFileSync(outPath, source, 'utf-8');
  console.log(`\nWrote ${outPath}`);
  console.log('NOW HAND-EDIT IT — check prompt_en for leaked answers and trim must_include.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
