import { GoogleGenAI } from '@google/genai';
import { put } from '@vercel/blob';
import type { ImageGenerationResponse } from '@/types/ai';

const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

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

  // Extract image from response parts
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

  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType === 'image/webp' ? 'webp' : 'png';

  // Upload to Vercel Blob
  const blob = await put(`mnemonics/${Date.now()}.${ext}`, buffer, {
    access: 'public',
    contentType: mimeType ?? 'image/png',
  });

  return { imageUrl: blob.url };
}
