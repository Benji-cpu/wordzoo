/**
 * One-off fix: a scene anchor was deleted mid-test before the new upload
 * succeeded. Upload the archived original as WebP and point the DB row at
 * the new URL.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';
import sharp from 'sharp';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Find the scene whose anchor_image_url 404s because we deleted the blob.
  const rows = await sql`
    SELECT id, title, anchor_image_url FROM scenes
    WHERE anchor_image_url LIKE '%1776825618125%'
  `;
  if (rows.length === 0) {
    console.log('No broken anchor to fix.');
    return;
  }

  const png = await fs.readFile('backups/images/1776825618125.png');
  const webp = await sharp(png).webp({ quality: 85 }).toBuffer();
  console.log(`PNG ${png.length} → WebP ${webp.length}`);

  const blob = await put(`mnemonics/recovered-${Date.now()}.webp`, webp, {
    access: 'public',
    contentType: 'image/webp',
  });
  console.log(`Uploaded: ${blob.url}`);

  for (const r of rows) {
    await sql`UPDATE scenes SET anchor_image_url = ${blob.url} WHERE id = ${r.id}`;
    console.log(`Updated scene ${r.title}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
