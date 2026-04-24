/**
 * One-time (idempotent) recompression of existing Vercel Blob images.
 *
 * Every existing PNG under `mnemonics/` is downloaded, saved locally as an
 * archived original, re-encoded to WebP@85, uploaded to a new Blob URL, the
 * corresponding DB row is updated, and the old Blob is deleted.
 *
 * Handles all three image fields:
 *   - mnemonics.image_url
 *   - scene_phrases.composite_image_url
 *   - scenes.anchor_image_url
 *
 * Flags:
 *   --dry-run                 List work without touching anything.
 *   --table=mnemonics|phrases|scenes|all   Default: all.
 *   --limit=N                 Cap items processed (default: 1000).
 *   --delay=ms                Delay between items (default: 500).
 *   --skip-webp               Skip rows whose URL already ends in .webp.
 *                             (default on — you almost always want this)
 *   --include-webp            Force-recompress rows already served as .webp.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import path from 'node:path';
import fs from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';

type TableChoice = 'mnemonics' | 'phrases' | 'scenes' | 'all';

const tableArg = (process.argv.find((a) => a.startsWith('--table='))?.replace('--table=', '') ?? 'all') as TableChoice;
const limitArg = parseInt(process.argv.find((a) => a.startsWith('--limit='))?.replace('--limit=', '') ?? '1000', 10);
const delayMs = parseInt(process.argv.find((a) => a.startsWith('--delay='))?.replace('--delay=', '') ?? '0', 10);
const concurrency = parseInt(process.argv.find((a) => a.startsWith('--concurrency='))?.replace('--concurrency=', '') ?? '5', 10);
const fetchTimeoutMs = parseInt(process.argv.find((a) => a.startsWith('--fetch-timeout='))?.replace('--fetch-timeout=', '') ?? '20000', 10);
const isDryRun = process.argv.includes('--dry-run');
const includeWebp = process.argv.includes('--include-webp');

const ARCHIVE_DIR = process.env.IMAGE_ARCHIVE_DIR ?? path.join(process.cwd(), 'backups', 'images');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function looksLikeBlobUrl(url: string | null | undefined): url is string {
  return !!url && url.includes('vercel-storage.com');
}

function pathnameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/+/, '');
  } catch {
    return url;
  }
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), fetchTimeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } finally {
    clearTimeout(timer);
  }
}

/** Look for the original in the local archive by filename. */
async function loadFromArchive(pathname: string): Promise<Buffer | null> {
  const filename = pathname.split('/').pop();
  if (!filename) return null;
  try {
    return await fs.readFile(path.join(ARCHIVE_DIR, filename));
  } catch {
    return null;
  }
}

async function archiveOriginal(buffer: Buffer, pathname: string): Promise<void> {
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  const filename = pathname.split('/').pop() ?? `${Date.now()}.bin`;
  try {
    await fs.writeFile(path.join(ARCHIVE_DIR, filename), buffer);
  } catch (e) {
    console.error(`  WARN: failed to archive ${filename}: ${(e as Error).message}`);
  }
}

async function recompressOne(
  id: string,
  url: string,
  label: string
): Promise<{ oldBytes: number; newBytes: number; newUrl: string; oldUrlDeleted: boolean } | null> {
  const oldPath = pathnameFromUrl(url);
  console.log(`  ${label} [${id.slice(0, 8)}] ${oldPath}`);

  let oldBuffer: Buffer;
  let sourceLabel = 'remote';
  try {
    oldBuffer = await downloadBuffer(url);
  } catch (e) {
    // The remote blob might have been deleted (e.g. by an earlier aborted
    // recompression run). Fall back to the local archive so we can still
    // flip the DB row to a working URL.
    const archived = await loadFromArchive(oldPath);
    if (!archived) throw e;
    console.log(`    remote 404 — using local archive`);
    oldBuffer = archived;
    sourceLabel = 'archive';
  }
  const oldBytes = oldBuffer.length;

  if (!includeWebp && oldPath.endsWith('.webp')) {
    console.log(`    already webp (${oldBytes} bytes) — skipped`);
    return null;
  }

  if (isDryRun) {
    console.log(`    DRY RUN: would compress ${oldBytes} bytes → WebP@85 → reupload → update DB → del old`);
    return null;
  }

  // Archive original before any destructive operation.
  await archiveOriginal(oldBuffer, oldPath);

  // Compress into memory.
  const webp = await sharp(oldBuffer).webp({ quality: 85 }).toBuffer();
  const newBytes = webp.length;

  // Delete OLD blob first. Required because we may be at Blob quota — the
  // upload will fail until there's space. Archive above is the safety net if
  // upload fails after deletion. Skip when we loaded from archive (remote is
  // already gone).
  let oldUrlDeleted = false;
  if (sourceLabel === 'remote') {
    try {
      await del(url);
      oldUrlDeleted = true;
    } catch (e) {
      console.error(`    WARN: failed to delete old blob: ${(e as Error).message}`);
    }
  }

  // Upload new blob.
  const folder = oldPath.split('/')[0] || 'mnemonics';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
  let newBlob;
  try {
    newBlob = await put(`${folder}/${filename}`, webp, {
      access: 'public',
      contentType: 'image/webp',
    });
  } catch (uploadError) {
    // If we deleted the old blob but the new upload failed, restore the
    // original so the app continues to work. The user can rerun this script
    // later once root cause is resolved.
    if (oldUrlDeleted) {
      console.error(`    FAIL: WebP upload failed after deleting old blob. Restoring original.`);
      try {
        const restored = await put(`${folder}/restored-${filename.replace('.webp', '.png')}`, oldBuffer, {
          access: 'public',
          contentType: 'image/png',
        });
        // Caller will update DB to the restored URL.
        return { oldBytes, newBytes: oldBytes, newUrl: restored.url, oldUrlDeleted };
      } catch (restoreError) {
        console.error(`    FAIL: restore also failed: ${(restoreError as Error).message}`);
      }
    }
    throw uploadError;
  }

  return { oldBytes, newBytes, newUrl: newBlob.url, oldUrlDeleted };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  const tables: Array<TableChoice> = tableArg === 'all' ? ['mnemonics', 'phrases', 'scenes'] : [tableArg];

  console.log(`=== Recompress Blob images${isDryRun ? ' [DRY RUN]' : ''} ===`);
  console.log(`  tables=${tables.join(',')}  limit=${limitArg}  delay=${delayMs}ms  include_webp=${includeWebp}`);
  console.log(`  archive_dir=${ARCHIVE_DIR}`);
  console.log('');

  // Gather all work upfront so we can batch with a fixed concurrency.
  const allRows: Array<{ id: string; url: string; label: string; table: 'mnemonics' | 'phrases' | 'scenes' }> = [];
  for (const table of tables) {
    let rows: Array<{ id: string; url: string; label: string; table: 'mnemonics' | 'phrases' | 'scenes' }> = [];
    if (table === 'mnemonics') {
      const r = await sql`
        SELECT id, image_url AS url FROM mnemonics
        WHERE image_url IS NOT NULL AND image_url LIKE '%vercel-storage.com%'
        ORDER BY created_at
      `;
      rows = r.map((x) => ({ id: x.id as string, url: x.url as string, label: 'mnemonic', table: 'mnemonics' as const }));
    } else if (table === 'phrases') {
      const r = await sql`
        SELECT id, composite_image_url AS url FROM scene_phrases
        WHERE composite_image_url IS NOT NULL AND composite_image_url LIKE '%vercel-storage.com%'
      `;
      rows = r.map((x) => ({ id: x.id as string, url: x.url as string, label: 'phrase', table: 'phrases' as const }));
    } else if (table === 'scenes') {
      const r = await sql`
        SELECT id, anchor_image_url AS url FROM scenes
        WHERE anchor_image_url IS NOT NULL AND anchor_image_url LIKE '%vercel-storage.com%'
      `;
      rows = r.map((x) => ({ id: x.id as string, url: x.url as string, label: 'anchor', table: 'scenes' as const }));
    }
    allRows.push(...rows);
  }

  const targetRows = allRows.slice(0, limitArg);
  console.log(`Total work: ${targetRows.length} rows. Concurrency: ${concurrency}. Fetch timeout: ${fetchTimeoutMs}ms.\n`);

  let processed = 0;
  let succeeded = 0;
  let skipped = 0;
  let failed = 0;
  let oldTotal = 0;
  let newTotal = 0;

  async function processRow(row: typeof targetRows[number]) {
    try {
      const result = await recompressOne(row.id, row.url, row.label);
      if (result === null) {
        skipped++;
        return;
      }
      if (row.table === 'mnemonics') {
        await sql`UPDATE mnemonics SET image_url = ${result.newUrl} WHERE id = ${row.id}`;
      } else if (row.table === 'phrases') {
        await sql`UPDATE scene_phrases SET composite_image_url = ${result.newUrl} WHERE id = ${row.id}`;
      } else {
        await sql`UPDATE scenes SET anchor_image_url = ${result.newUrl} WHERE id = ${row.id}`;
      }
      oldTotal += result.oldBytes;
      newTotal += result.newBytes;
      console.log(`    ${result.oldBytes} → ${result.newBytes} bytes (${((result.newBytes / result.oldBytes) * 100).toFixed(1)}%)`);
      succeeded++;
    } catch (error) {
      console.error(`    FAIL: ${(error as Error).message}`);
      failed++;
    } finally {
      processed++;
      if (processed % 25 === 0) {
        console.log(`--- progress: ${processed}/${targetRows.length}  ok=${succeeded} skip=${skipped} fail=${failed} ---`);
      }
    }
  }

  // Simple worker pool: N workers pull from a shared queue index.
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= targetRows.length) return;
      await processRow(targetRows[i]);
      if (delayMs > 0) await sleep(delayMs);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log('');
  console.log(`=== Done ===`);
  console.log(`  processed=${processed}  succeeded=${succeeded}  skipped=${skipped}  failed=${failed}`);
  if (succeeded > 0) {
    const savedMB = ((oldTotal - newTotal) / 1024 / 1024).toFixed(2);
    const oldMB = (oldTotal / 1024 / 1024).toFixed(2);
    const newMB = (newTotal / 1024 / 1024).toFixed(2);
    console.log(`  storage: ${oldMB} MB → ${newMB} MB  (saved ${savedMB} MB)`);
  }
  if (isDryRun) console.log('  (DRY RUN — no changes made)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
