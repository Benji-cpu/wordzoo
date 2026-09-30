import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { ALL_PT_SCENES } from './content/pt';

/**
 * One-off: move the live pt path to the trip-first scene order (family unit
 * first: lib/db/content/pt/unit*.ts carry the new sort_order values). Same
 * result as re-running `db:seed-expanded --lang=pt`, without touching any
 * words, phrases or audio.
 *
 * Dry run by default — prints before/after. `--apply` writes.
 * Run: npx tsx lib/db/apply-pt-trip-order.ts [--apply]
 */
async function main() {
  const apply = process.argv.includes('--apply');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  const ids = ALL_PT_SCENES.map((s) => s.id);
  // Scoped to the pt language's paths so a stray id can never touch another path.
  const rows = (await sql`
    SELECT s.id, s.title, s.sort_order
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    WHERE l.code = 'pt' AND s.id = ANY(${ids}::uuid[])
  `) as { id: string; title: string; sort_order: number }[];
  const before = new Map(rows.map((r) => [r.id, r]));

  const missing = ids.filter((id) => !before.has(id));
  if (missing.length > 0) {
    console.error(`${missing.length} scene(s) in the content files are not in the pt path:`);
    missing.forEach((id) => console.error(`  ${id}`));
    process.exit(1);
  }

  const targets = [...ALL_PT_SCENES].sort((a, b) => a.sort_order - b.sort_order);
  const orders = targets.map((s) => s.sort_order);
  if (new Set(orders).size !== orders.length) {
    console.error('Duplicate sort_order values in the content files; aborting.');
    process.exit(1);
  }

  console.log(apply ? '=== APPLYING pt trip order ===' : '=== DRY RUN (pass --apply to write) ===');
  let changed = 0;
  for (const s of targets) {
    const was = before.get(s.id)!.sort_order;
    const flag = was === s.sort_order ? '  ' : '->';
    if (was !== s.sort_order) changed++;
    console.log(`${String(s.sort_order).padStart(2)}  ${flag} was ${String(was).padStart(2)}  ${s.title}`);
  }
  console.log(`\n${changed} scene(s) change order.`);

  if (!apply || changed === 0) return;

  // One transaction: readers never see a half-shuffled path.
  await sql.transaction(
    targets.map((s) => sql`UPDATE scenes SET sort_order = ${s.sort_order} WHERE id = ${s.id}`),
  );

  const after = (await sql`
    SELECT s.sort_order, s.title FROM scenes s WHERE s.id = ANY(${ids}::uuid[]) ORDER BY s.sort_order
  `) as { sort_order: number; title: string }[];
  console.log('\nAfter:');
  after.forEach((r) => console.log(`${String(r.sort_order).padStart(2)}  ${r.title}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
