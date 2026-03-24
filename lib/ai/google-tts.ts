import { put } from '@vercel/blob';

const TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Voice config per language code
const VOICE_CONFIG: Record<string, { languageCode: string; name: string }> = {
  id: { languageCode: 'id-ID', name: 'id-ID-Wavenet-A' },
  es: { languageCode: 'es-US', name: 'es-US-Neural2-A' },
  ja: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' },
  en: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
};

export async function synthesizeSpeech(
  text: string,
  langCode: string,
  blobPath: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_TTS_API_KEY environment variable is not set');
  }

  const voice = VOICE_CONFIG[langCode];
  if (!voice) {
    throw new Error(`No TTS voice configured for language: ${langCode}`);
  }

  const response = await fetch(`${TTS_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.85,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const audioContent = data.audioContent as string; // base64-encoded MP3

  // Decode base64 → upload to Vercel Blob
  const audioBuffer = Buffer.from(audioContent, 'base64');
  const blob = await put(blobPath, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  });

  return blob.url;
}
