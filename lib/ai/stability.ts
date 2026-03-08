import { put } from '@vercel/blob';
import type { StabilityImageOptions, StabilityImageResponse } from '@/types/ai';

const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';

export async function generateImage(
  prompt: string,
  options: StabilityImageOptions = {}
): Promise<StabilityImageResponse> {
  const apiKey = process.env.STABILITY_AI_API_KEY;
  if (!apiKey) {
    throw new Error('STABILITY_AI_API_KEY environment variable is not set');
  }

  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('output_format', 'png');
  if (options.cfgScale) formData.append('cfg_scale', String(options.cfgScale));
  if (options.style) formData.append('style_preset', options.style);

  const response = await fetch(STABILITY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'image/*',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stability AI error (${response.status}): ${errorText}`);
  }

  const imageBuffer = await response.arrayBuffer();
  const seed = parseInt(response.headers.get('x-seed') ?? '0', 10);

  // Upload to Vercel Blob
  const blob = await put(`mnemonics/${Date.now()}-${seed}.png`, imageBuffer, {
    access: 'public',
    contentType: 'image/png',
  });

  return {
    imageUrl: blob.url,
    seed,
  };
}
