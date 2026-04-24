import { GoogleGenAI } from '@google/genai';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { ImageGenerationResponse } from '@/types/ai';

const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

/**
 * Convert a PNG/JPEG buffer to WebP at quality 85.
 * Stability/Gemini 1024×1024 PNGs (~1MB) compress to ~150-250KB with no
 * perceivable loss for mnemonic illustrations.
 */
async function toWebP(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).webp({ quality: 85 }).toBuffer();
}

/**
 * Best-effort archive of the original PNG to the local filesystem. Only runs
 * outside serverless environments — on Vercel this silently no-ops because
 * there's no persistent disk. Controlled by the `IMAGE_ARCHIVE_DIR` env var;
 * defaults to `backups/images/` relative to the project root during local
 * scripts (backfills). In production runtime this is skipped entirely.
 */
async function archiveOriginal(buffer: Buffer, filename: string, mimeType: string): Promise<void> {
  if (process.env.VERCEL || process.env.IMAGE_ARCHIVE_DIR === 'off') return;
  const dir = process.env.IMAGE_ARCHIVE_DIR ?? path.join(process.cwd(), 'backups', 'images');
  try {
    await fs.mkdir(dir, { recursive: true });
    const ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/jpeg' ? 'jpg' : 'png';
    await fs.writeFile(path.join(dir, `${filename}.${ext}`), buffer);
  } catch {
    // Best-effort — don't break the generation pipeline on disk issues.
  }
}

export async function generateImage(prompt: string): Promise<ImageGenerationResponse> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: '1:1',
        imageSize: '1K',
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error('No response parts from image generation');
  }

  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart?.inlineData) {
    throw new Error('No image data in response');
  }

  const { data: base64Data, mimeType } = imagePart.inlineData;
  if (!base64Data) {
    throw new Error('Empty image data in response');
  }

  const rawBuffer = Buffer.from(base64Data, 'base64');
  const filename = String(Date.now());

  // Archive the original locally when running outside serverless.
  await archiveOriginal(rawBuffer, filename, mimeType ?? 'image/png');

  // Always upload as WebP — Blob storage quota is the constraint, WebP is
  // ~5× smaller than PNG at visually-identical quality for illustrated content.
  const webpBuffer = mimeType === 'image/webp' ? rawBuffer : await toWebP(rawBuffer);

  const blob = await put(`mnemonics/${filename}.webp`, webpBuffer, {
    access: 'public',
    contentType: 'image/webp',
  });

  return { imageUrl: blob.url };
}
