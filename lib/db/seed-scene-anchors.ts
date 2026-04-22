/**
 * Backfill scene anchor images (the "memory palace room" hero image for each
 * scene). For scenes with a pre-written anchor prompt in SCENE_ANCHOR_DATA,
 * use it verbatim; otherwise synthesise a prompt from scene title/description
 * in the shared illustration style.
 *
 * Flags:
 *   --dry-run
 *   --limit=N   (default 5)
 *   --delay=ms  (default 2500)
 *   --only=sceneTitleSubstring
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { generateImage } from '../ai/image-generation';
import { SCENE_ANCHOR_DATA } from './scene-anchor-data';

const limitArg = parseInt(process.argv.find((a) => a.startsWith('--limit='))?.replace('--limit=', '') ?? '5', 10);
const delayMs = parseInt(process.argv.find((a) => a.startsWith('--delay='))?.replace('--delay=', '') ?? '2500', 10);
const onlyFilter = process.argv.find((a) => a.startsWith('--only='))?.replace('--only=', '');
const isDryRun = process.argv.includes('--dry-run');

const STYLE_SUFFIX = 'digital illustration, warm colors, atmospheric lighting, wide composition, establishing shot';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function promptFromScene(scene: { id: string; title: string; description: string | null }): string {
  const pre = SCENE_ANCHOR_DATA[scene.id];
  if (pre?.anchorImagePrompt) return pre.anchorImagePrompt;

  const base = scene.description?.trim() || `A warm scene representing "${scene.title}"`;
  return `${base}. No text overlays. ${STYLE_SUFFIX}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log(`=== Backfilling scene anchor images${isDryRun ? ' [DRY RUN]' : ''} ===`);
  console.log(`  limit=${limitArg} delay=${delayMs}ms`);
  if (onlyFilter) console.log(`  only=${onlyFilter}`);
  console.log('');

  let scenes = (await sql`
    SELECT s.id, s.title, s.description, p.title AS path_title
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    WHERE s.anchor_image_url IS NULL
    ORDER BY p.title, s.sort_order
  `) as Array<{ id: string; title: string; description: string | null; path_title: string }>;

  if (onlyFilter) {
    scenes = scenes.filter((s) => s.title.toLowerCase().includes(onlyFilter.toLowerCase()));
  }

  console.log(`Found ${scenes.length} scenes missing anchor images.`);
  const target = scenes.slice(0, limitArg);
  console.log(`Processing ${target.length} (limit ${limitArg}).\n`);

  if (target.length === 0) return;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < target.length; i++) {
    const scene = target[i];
    const prompt = promptFromScene(scene);
    console.log(`[${i + 1}/${target.length}] ${scene.path_title} → ${scene.title}`);
    console.log(`  Source: ${SCENE_ANCHOR_DATA[scene.id] ? 'SCENE_ANCHOR_DATA' : 'title+description'}`);

    if (isDryRun) {
      console.log(`  → DRY RUN: would generate image`);
      console.log(`  → Prompt: "${prompt.slice(0, 120)}..."`);
      successCount++;
      continue;
    }

    try {
      console.log('  Generating image...');
      const result = await generateImage(prompt);
      console.log(`  Image URL: ${result.imageUrl}`);

      await sql`UPDATE scenes SET anchor_image_url = ${result.imageUrl} WHERE id = ${scene.id}`;
      console.log('  Saved!');
      successCount++;

      if (i < target.length - 1) await sleep(delayMs);
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
      await sleep(delayMs);
    }
  }

  console.log(`\n=== Done! ${successCount} generated, ${failCount} failed ===`);
  if (isDryRun) console.log('(Dry run — no changes made to the database)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
