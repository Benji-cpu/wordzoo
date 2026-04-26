/**
 * Audit visual mnemonic coverage across every active scene.
 *
 * The user has repeatedly stated: every learnable unit (word OR phrase) MUST
 * have a visual mnemonic. This script is the systemic guarantee — it exits
 * non-zero if any scene that's part of an active path has a missing visual,
 * making it suitable as a pre-commit check or CI gate.
 *
 * Definitions of "missing":
 *   - Scene word with NO canonical mnemonic row at all
 *   - Canonical mnemonic row with NULL image_url
 *   - Scene phrase with NULL composite_image_url
 *   - Scene phrase with NULL audio_url
 *   - Scene with NULL anchor_image_url
 *
 * Flags:
 *   --strict          fail on any missing visual (default)
 *   --warn            report only, never fail (exit 0)
 *   --json            emit JSON to stdout (machine-readable)
 *   --scope=active    only audit scenes belonging to paths with at least one
 *                     active user_paths row (default)
 *   --scope=all       audit every seeded scene
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const args = process.argv.slice(2);
const strict = !args.includes('--warn');
const asJson = args.includes('--json');
const scope = args.find((a) => a.startsWith('--scope='))?.split('=')[1] ?? 'active';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const sceneFilter = scope === 'active'
    ? sql`AND p.id IN (SELECT DISTINCT path_id FROM user_paths WHERE status IN ('active','completed'))`
    : sql``;

  const sceneRows = await sql`
    SELECT
      s.id, s.title, s.sort_order, s.anchor_image_url,
      p.id AS path_id, p.title AS path_title,
      l.name AS language_name
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    WHERE 1=1 ${sceneFilter}
    ORDER BY p.title, s.sort_order
  `;

  type Issue = { kind: string; description: string };
  const sceneIssues: Map<string, { title: string; path: string; lang: string; issues: Issue[] }> = new Map();

  for (const s of sceneRows) {
    const issues: Issue[] = [];

    if (!s.anchor_image_url) {
      issues.push({ kind: 'scene_anchor', description: 'scene anchor image missing' });
    }

    const orphanWords = await sql`
      SELECT w.id, w.text, w.meaning_en
      FROM scene_words sw
      JOIN words w ON w.id = sw.word_id
      WHERE sw.scene_id = ${s.id}
        AND NOT EXISTS (SELECT 1 FROM mnemonics m WHERE m.word_id = w.id AND m.user_id IS NULL)
    `;
    for (const w of orphanWords) {
      issues.push({ kind: 'orphan_word', description: `"${w.text}" (${w.meaning_en}) has no canonical mnemonic row` });
    }

    const noImageMnemonics = await sql`
      SELECT m.id, w.text, w.meaning_en, m.keyword_text
      FROM scene_words sw
      JOIN words w ON w.id = sw.word_id
      JOIN mnemonics m ON m.word_id = w.id AND m.user_id IS NULL
      WHERE sw.scene_id = ${s.id} AND m.image_url IS NULL
    `;
    for (const m of noImageMnemonics) {
      issues.push({ kind: 'mnemonic_image', description: `"${m.text}" (${m.meaning_en}) keyword="${m.keyword_text}" has no image` });
    }

    const phrasesNoImage = await sql`
      SELECT id, text_target, text_en
      FROM scene_phrases
      WHERE scene_id = ${s.id} AND composite_image_url IS NULL
    `;
    for (const p of phrasesNoImage) {
      issues.push({ kind: 'phrase_image', description: `phrase "${p.text_target}" (${p.text_en}) has no composite image` });
    }

    const phrasesNoAudio = await sql`
      SELECT id, text_target, text_en
      FROM scene_phrases
      WHERE scene_id = ${s.id} AND audio_url IS NULL
    `;
    for (const p of phrasesNoAudio) {
      issues.push({ kind: 'phrase_audio', description: `phrase "${p.text_target}" (${p.text_en}) has no audio` });
    }

    if (issues.length > 0) {
      sceneIssues.set(s.id as string, {
        title: `${s.path_title} → ${s.title}`,
        path: s.path_title as string,
        lang: s.language_name as string,
        issues,
      });
    }
  }

  const totalIssues = Array.from(sceneIssues.values()).reduce((n, s) => n + s.issues.length, 0);

  if (asJson) {
    console.log(JSON.stringify({
      scope,
      scenes_audited: sceneRows.length,
      scenes_with_issues: sceneIssues.size,
      total_issues: totalIssues,
      details: Array.from(sceneIssues.entries()).map(([id, v]) => ({ scene_id: id, ...v })),
    }, null, 2));
  } else {
    console.log(`\n=== Mnemonic Coverage Audit (scope=${scope}) ===`);
    console.log(`Scenes audited: ${sceneRows.length}`);
    console.log(`Scenes with issues: ${sceneIssues.size}`);
    console.log(`Total missing visuals: ${totalIssues}\n`);
    for (const [, s] of sceneIssues) {
      console.log(`[${s.lang}] ${s.title} — ${s.issues.length} issue(s)`);
      for (const i of s.issues) {
        console.log(`  · [${i.kind}] ${i.description}`);
      }
    }
  }

  if (strict && totalIssues > 0) {
    console.error(`\nFAIL: ${totalIssues} missing visuals across ${sceneIssues.size} scenes. Run "npm run db:backfill-images" to fill, or rerun with --warn to skip the gate.`);
    process.exit(1);
  }
  console.log('\nOK');
}

main().catch((e) => { console.error(e); process.exit(1); });
