import { put, head } from '@vercel/blob';
import { createHash } from 'crypto';

const TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Voice config per language code
const VOICE_CONFIG: Record<string, { languageCode: string; name: string }> = {
  id: { languageCode: 'id-ID', name: 'id-ID-Wavenet-A' },
  es: { languageCode: 'es-US', name: 'es-US-Neural2-A' },
  ja: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' },
  pt: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-A' },
  en: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
};

export function hasTtsVoice(langCode: string): boolean {
  return Boolean(VOICE_CONFIG[langCode]);
}

/**
 * The rate everything is spoken at.
 *
 * Named and shared rather than written at each call site, because pacing is a
 * property of the app's voice, not of whichever script generated a given clip.
 * 0.85 was chosen for isolated vocabulary — slow enough to hear the vowels in a
 * word you have never met. Sentences at that rate sound like a warning
 * announcement, so connected speech gets its own, closer to normal.
 */
export const RATE_WORD = 0.85;
export const RATE_SENTENCE = 0.95;

/**
 * Speak arbitrary text, reusing the clip if we have said it before.
 *
 * The seed scripts pre-generate audio for every word and mnemonic, but nothing
 * else in the app could reach a real voice: `synthesizeSpeech` only ran offline,
 * so every line of narration, feedback and tutor reply fell through to the
 * browser's built-in synthesiser. That is the robotic voice — not a missing
 * word clip, but the absence of any runtime path to the good one.
 *
 * The blob path is a hash of exactly the inputs that change the audio, so the
 * same sentence is synthesised once for the entire user base and served from
 * cache forever after. That is what makes it affordable to speak everything:
 * the app has a fixed vocabulary of phrasings, and it pays for each one once.
 */
export async function synthesizeCached(
  text: string,
  langCode: string,
  rate: number = RATE_SENTENCE,
): Promise<{ url: string; cached: boolean }> {
  const voice = VOICE_CONFIG[langCode];
  if (!voice) throw new Error(`No TTS voice configured for language: ${langCode}`);

  const key = createHash('sha256')
    .update(`${voice.name}|${rate}|${text}`)
    .digest('hex')
    .slice(0, 32);
  const blobPath = `tts/${langCode}/${key}.mp3`;

  try {
    const existing = await head(blobPath);
    if (existing?.url) return { url: existing.url, cached: true };
  } catch {
    // Not found (or the store is briefly unreachable) — synthesize below. A
    // failed lookup costs one extra generation, never a wrong clip.
  }

  const url = await synthesizeSpeech(text, langCode, blobPath, rate, true);
  return { url, cached: false };
}

export async function synthesizeSpeech(
  text: string,
  langCode: string,
  blobPath: string,
  rate: number = RATE_WORD,
  /**
   * Write to exactly `blobPath` instead of letting Blob append a random
   * suffix. Required by the runtime cache, whose whole design is that the path
   * is a hash of the input and can therefore be looked up again. Off by default
   * so the seed scripts keep the upload behaviour they were written against.
   */
  deterministicPath = false
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
    // Without this a stalled TTS call hangs the enclosing lambda indefinitely.
    signal: AbortSignal.timeout(20_000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: rate,
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
    ...(deterministicPath ? { addRandomSuffix: false, allowOverwrite: true } : {}),
  });

  return blob.url;
}
