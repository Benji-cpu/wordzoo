import { put, head } from '@vercel/blob';
import { createHash } from 'crypto';

const TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Voice config per language code
const VOICE_CONFIG: Record<string, { languageCode: string; name: string; label: string }> = {
  id: { languageCode: 'id-ID', name: 'id-ID-Wavenet-A', label: 'Indonesian' },
  es: { languageCode: 'es-US', name: 'es-US-Neural2-A', label: 'Spanish' },
  ja: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B', label: 'Japanese' },
  pt: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-A', label: 'Portuguese' },
  en: { languageCode: 'en-US', name: 'en-US-Neural2-C', label: 'English' },
};

/**
 * The free voice, used when Cloud TTS cannot be reached.
 *
 * Cloud TTS is billing-gated and that billing has never been enabled, so every
 * runtime call to it has failed since the route was written and the browser's
 * built-in synthesiser spoke instead. Gemini's TTS model needs no billing and
 * runs on the key the app already has, so the fallback below is what actually
 * speaks today. Cloud TTS stays first: if billing is ever switched on, the
 * better voice comes back with no code change.
 */
const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const GEMINI_VOICE = 'Kore';

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

  // Two containers, because two voices can produce this clip: Cloud TTS writes
  // MP3, the free Gemini fallback writes WAV. Whichever spoke it first wins the
  // cache; checking only one extension would re-synthesise every hit from the
  // other.
  for (const candidate of [blobPath, blobPath.replace(/\.mp3$/, '.wav')]) {
    try {
      const existing = await head(candidate);
      if (existing?.url) return { url: existing.url, cached: true };
    } catch {
      // Not found (or the store is briefly unreachable) — synthesize below. A
      // failed lookup costs one extra generation, never a wrong clip.
    }
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
  const voice = VOICE_CONFIG[langCode];
  if (!voice) {
    throw new Error(`No TTS voice configured for language: ${langCode}`);
  }

  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  const clip = apiKey
    ? await synthesizeViaCloudTts(text, voice, rate, apiKey).catch((err) => {
        console.warn(`[tts] Cloud TTS unavailable, falling back to Gemini — ${err}`);
        return null;
      })
    : null;

  const audio = clip ?? (await synthesizeViaGemini(text, voice, rate));

  // The container follows the voice that produced it, so a WAV is never served
  // under an .mp3 path — Safari refuses the mismatch.
  const path = audio.contentType === 'audio/wav'
    ? blobPath.replace(/\.mp3$/, '.wav')
    : blobPath;

  const blob = await put(path, audio.buffer, {
    access: 'public',
    contentType: audio.contentType,
    ...(deterministicPath ? { addRandomSuffix: false, allowOverwrite: true } : {}),
  });

  return blob.url;
}

type Clip = { buffer: Buffer; contentType: string };
type Voice = (typeof VOICE_CONFIG)[string];

async function synthesizeViaCloudTts(
  text: string,
  voice: Voice,
  rate: number,
  apiKey: string,
): Promise<Clip> {
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
  return { buffer: Buffer.from(audioContent, 'base64'), contentType: 'audio/mpeg' };
}

/**
 * The free path: Gemini's TTS model, on the key the app already uses.
 *
 * It takes no speakingRate, so pace is asked for in words instead — that is the
 * documented way to steer this model, and the instruction is not spoken. It
 * returns headerless PCM, which no browser will play, so a RIFF header is added
 * here rather than anywhere further down.
 */
async function synthesizeViaGemini(text: string, voice: Voice, rate: number): Promise<Clip> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('No TTS voice available: GOOGLE_GEMINI_API_KEY is not set');

  const pace = rate <= RATE_WORD ? 'slowly and very clearly' : 'clearly, at a natural pace';
  const prompt = `Read the following ${voice.label} aloud ${pace}. Read only the text itself, nothing else:\n\n${text}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(20_000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE } } },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini TTS error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const part = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part?.data) throw new Error('Gemini TTS returned no audio');

  const rateHz = Number(/rate=(\d+)/.exec(part.mimeType ?? '')?.[1] ?? 24000);
  return { buffer: pcmToWav(Buffer.from(part.data, 'base64'), rateHz), contentType: 'audio/wav' };
}

/** Wrap raw 16-bit mono PCM in the 44-byte RIFF header browsers expect. */
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * 2;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);        // PCM chunk size
  header.writeUInt16LE(1, 20);         // format: PCM
  header.writeUInt16LE(1, 22);         // channels: mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(2, 32);         // block align
  header.writeUInt16LE(16, 34);        // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
