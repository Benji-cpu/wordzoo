import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { getCanDosForLanguage } from './content/can-dos';

/**
 * Seeds can_dos from the committed, hand-edited content files. Idempotent —
 * ids are deterministic, so a re-run updates in place rather than duplicating.
 *
 * This is what you run after editing lib/db/content/can-dos/<lang>.ts.
 *
 * Run: npx tsx lib/db/seed-can-dos.ts --language=id
 */
function parseFlag(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, '');
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  const lang = parseFlag('language') ?? 'id';
  const canDos = getCanDosForLanguage(lang);

  console.log(`=== Seeding can-dos (${lang}) ===`);
  console.log(`${canDos.length} statement(s) in the content file\n`);

  if (canDos.length === 0) {
    console.log('Nothing to seed.');
    return;
  }

  // Scenes the content file references but that don't exist would fail the FK
  // one row at a time; check up front so the report is useful.
  const sceneIds = [...new Set(canDos.map((c) => c.sceneId))];
  const known = (await sql`
    SELECT id FROM scenes WHERE id = ANY(${sceneIds}::uuid[])
  `) as { id: string }[];
  const knownSet = new Set(known.map((s) => s.id));
  const orphans = sceneIds.filter((id) => !knownSet.has(id));
  if (orphans.length > 0) {
    console.error(`✗ ${orphans.length} referenced scene(s) do not exist:`);
    orphans.forEach((id) => console.error(`   ${id}`));
    console.error('Fix the content file (or seed the scenes first) and re-run.');
    process.exit(1);
  }

  let inserted = 0;
  for (const c of canDos) {
    await sql`
      INSERT INTO can_dos (
        id, scene_id, statement_en, prompt_en, reference_target,
        accept_notes, must_include, sort_order, source
      ) VALUES (
        ${c.id}, ${c.sceneId}, ${c.statement_en}, ${c.prompt_en}, ${c.reference_target},
        ${c.accept_notes ?? null}, ${c.must_include}, ${c.sort_order}, 'ai_generated'
      )
      ON CONFLICT (id) DO UPDATE SET
        scene_id = EXCLUDED.scene_id,
        statement_en = EXCLUDED.statement_en,
        prompt_en = EXCLUDED.prompt_en,
        reference_target = EXCLUDED.reference_target,
        accept_notes = EXCLUDED.accept_notes,
        must_include = EXCLUDED.must_include,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `;
    inserted++;
  }

  const total = (await sql`SELECT COUNT(*)::int AS n FROM can_dos`) as { n: number }[];
  console.log(`Upserted ${inserted}. can_dos now holds ${total[0].n} row(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
