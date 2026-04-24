/**
 * Delete Blob objects that aren't referenced by any DB row.
 *
 * Archives each orphan to backups/images/ first, so deletions are recoverable.
 * Handles 3 source tables: mnemonics.image_url, scene_phrases.composite_image_url,
 * scenes.anchor_image_url.
 *
 * Flags:
 *   --dry-run       Print list, no downloads/deletes.
 *   --limit=N       Cap number of blobs deleted (default 1000).
 *   --delay=ms      Delay between deletes (default 150).
 *   --skip-archive  Skip local archive (faster, but destructive).
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import path from 'node:path';
import fs from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { del, list } from '@vercel/blob';

const isDryRun = process.argv.includes('--dry-run');
const limitArg = parseInt(process.argv.find((a) => a.startsWith('--limit='))?.replace('--limit=', '') ?? '1000', 10);
const delayMs = parseInt(process.argv.find((a) => a.startsWith('--delay='))?.replace('--delay=', '') ?? '150', 10);
const skipArchive = process.argv.includes('--skip-archive');

const ARCHIVE_DIR = process.env.IMAGE_ARCHIVE_DIR ?? path.join(process.cwd(), 'backups', 'images');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log(`=== Cleanup orphan blobs${isDryRun ? ' [DRY RUN]' : ''} ===`);
  console.log(`  limit=${limitArg}  delay=${delayMs}ms  skip_archive=${skipArchive}`);
  console.log('');

  // Gather all referenced URLs from DB.
  const [mRows, pRows, sRows] = await Promise.all([
    sql`SELECT image_url AS url FROM mnemonics WHERE image_url IS NOT NULL`,
    sql`SELECT composite_image_url AS url FROM scene_phrases WHERE composite_image_url IS NOT NULL`,
    sql`SELECT anchor_image_url AS url FROM scenes WHERE anchor_image_url IS NOT NULL`,
  ]);

  const referenced = new Set<string>();
  for (const r of [...mRows, ...pRows, ...sRows]) {
    if (typeof r.url === 'string') referenced.add(r.url);
  }
  console.log(`DB references ${referenced.size} blob URLs.`);

  // List all blobs (paginate until cursor is empty).
  let cursor: string | undefined = undefined;
  const allBlobs: Array<{ url: string; pathname: string; size: number }> = [];
  while (true) {
    const page: { blobs: Array<{ url: string; pathname: string; size: number }>; cursor?: string } = await list({ prefix: 'mnemonics/', limit: 1000, cursor });
    for (const b of page.blobs) allBlobs.push({ url: b.url, pathname: b.pathname, size: b.size });
    if (!page.cursor) break;
    cursor = page.cursor;
  }

  console.log(`Blob store contains ${allBlobs.length} objects.`);
  const totalBytes = allBlobs.reduce((s, b) => s + b.size, 0);
  console.log(`Total storage: ${(totalBytes / 1024 / 1024).toFixed(2)} MB\n`);

  const orphans = allBlobs.filter((b) => !referenced.has(b.url));
  const orphanBytes = orphans.reduce((s, b) => s + b.size, 0);
  console.log(`Found ${orphans.length} orphan blobs — ${(orphanBytes / 1024 / 1024).toFixed(2)} MB.`);

  if (orphans.length === 0) return;

  const target = orphans.slice(0, limitArg);
  console.log(`Processing ${target.length} (limit ${limitArg}).\n`);

  if (!skipArchive) await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  let deleted = 0;
  let archived = 0;
  let failed = 0;
  let freed = 0;

  for (let i = 0; i < target.length; i++) {
    const b = target[i];
    console.log(`[${i + 1}/${target.length}] ${b.pathname} (${(b.size / 1024).toFixed(1)} KB)`);

    if (isDryRun) continue;

    try {
      if (!skipArchive) {
        try {
          const res = await fetch(b.url);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            const filename = b.pathname.split('/').pop() ?? `${Date.now()}.bin`;
            await fs.writeFile(path.join(ARCHIVE_DIR, filename), buf);
            archived++;
          } else {
            console.error(`  WARN: archive fetch HTTP ${res.status} — deleting anyway`);
          }
        } catch (e) {
          console.error(`  WARN: archive failed (${(e as Error).message}) — deleting anyway`);
        }
      }

      await del(b.url);
      deleted++;
      freed += b.size;
      if (delayMs > 0) await sleep(delayMs);
    } catch (error) {
      console.error(`  FAIL: ${(error as Error).message}`);
      failed++;
      await sleep(delayMs);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  deleted=${deleted}  archived=${archived}  failed=${failed}`);
  console.log(`  freed ${(freed / 1024 / 1024).toFixed(2)} MB`);
  if (isDryRun) console.log('  (DRY RUN — no deletes)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
