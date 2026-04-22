import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const [mnTotal] = await sql`SELECT COUNT(*)::int c FROM mnemonics WHERE user_id IS NULL`;
  const [mnMiss] = await sql`SELECT COUNT(*)::int c FROM mnemonics WHERE user_id IS NULL AND image_url IS NULL`;
  const [phTotal] = await sql`SELECT COUNT(*)::int c FROM scene_phrases`;
  const [phMiss] = await sql`SELECT COUNT(*)::int c FROM scene_phrases WHERE composite_image_url IS NULL`;
  const [scTotal] = await sql`SELECT COUNT(*)::int c FROM scenes`;
  const [scMiss] = await sql`SELECT COUNT(*)::int c FROM scenes WHERE anchor_image_url IS NULL`;

  console.log('== Image Coverage ==');
  console.log(`Mnemonics: ${mnTotal.c - mnMiss.c}/${mnTotal.c} filled (${mnMiss.c} missing)`);
  console.log(`Phrases:   ${phTotal.c - phMiss.c}/${phTotal.c} filled (${phMiss.c} missing)`);
  console.log(`Scenes:    ${scTotal.c - scMiss.c}/${scTotal.c} filled (${scMiss.c} missing)`);

  const [orphanWords] = await sql`
    SELECT COUNT(DISTINCT w.id)::int c
    FROM words w
    JOIN scene_words sw ON sw.word_id = w.id
    WHERE NOT EXISTS (
      SELECT 1 FROM mnemonics m WHERE m.word_id = w.id AND m.user_id IS NULL
    )
  `;
  const [totalSceneWords] = await sql`
    SELECT COUNT(DISTINCT w.id)::int c FROM words w JOIN scene_words sw ON sw.word_id = w.id
  `;
  console.log(`\n== Scene words WITHOUT any canonical mnemonic row ==`);
  console.log(`${orphanWords.c} / ${totalSceneWords.c} scene words have NO mnemonic row at all`);

  if (orphanWords.c > 0) {
    const orphans = await sql`
      SELECT DISTINCT w.text, w.meaning_en, s.title scene_title, s.sort_order
      FROM words w
      JOIN scene_words sw ON sw.word_id = w.id
      JOIN scenes s ON s.id = sw.scene_id
      WHERE NOT EXISTS (
        SELECT 1 FROM mnemonics m WHERE m.word_id = w.id AND m.user_id IS NULL
      )
      ORDER BY s.sort_order, w.text
      LIMIT 50
    `;
    for (const o of orphans) {
      console.log(`  - "${o.text}" (${o.meaning_en}) in ${o.scene_title}`);
    }
  }

  console.log('\n== Missing scene anchor images by path ==');
  const sceneGaps = await sql`
    SELECT p.title path, COUNT(*)::int missing
    FROM scenes s JOIN paths p ON p.id = s.path_id
    WHERE s.anchor_image_url IS NULL
    GROUP BY p.title, p.id
    ORDER BY missing DESC`;
  for (const g of sceneGaps) console.log(`  ${g.path}: ${g.missing}`);

  console.log('\n== Scenes with sort_order=2 (what user called "scene 2") ==');
  const sceneTwo = await sql`
    SELECT s.id, s.title, s.anchor_image_url,
      p.title path_title,
      (SELECT COUNT(*)::int FROM scene_phrases sp WHERE sp.scene_id = s.id AND sp.composite_image_url IS NULL) phrase_miss,
      (SELECT COUNT(*)::int FROM scene_phrases sp WHERE sp.scene_id = s.id) phrase_total,
      (SELECT COUNT(*)::int FROM scene_words sw JOIN words w ON w.id = sw.word_id WHERE sw.scene_id = s.id AND NOT EXISTS (SELECT 1 FROM mnemonics m WHERE m.word_id = w.id AND m.user_id IS NULL AND m.image_url IS NOT NULL)) word_miss,
      (SELECT COUNT(*)::int FROM scene_words sw WHERE sw.scene_id = s.id) word_total
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    WHERE s.sort_order = 2
    ORDER BY p.title
    LIMIT 10
  `;
  for (const s of sceneTwo) {
    console.log(`  [${s.path_title} → ${s.title}]`);
    console.log(`    anchor=${s.anchor_image_url ? 'YES' : 'NO'}  phrase_images=${s.phrase_total - s.phrase_miss}/${s.phrase_total}  word_images=${s.word_total - s.word_miss}/${s.word_total}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
