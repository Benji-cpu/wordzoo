import type { Mnemonic } from '@/types/database';
import { pauseMs } from './voice-map';
import { speak } from './voice';

let currentAudio: HTMLAudioElement | null = null;

export async function narrateMnemonic(
  mnemonic: Pick<Mnemonic, 'keyword_text' | 'scene_description' | 'audio_url'>
): Promise<void> {
  stopNarration();

  if (mnemonic.audio_url) {
    try {
      return await playNarrationAudio(mnemonic.audio_url);
    } catch {
      // Blob outage or a stale URL — fall through and synthesize it instead of
      // dropping the hint entirely.
    }
  }

  // Chunked because the browser fallback at the end of `speak()` still has
  // Chrome's ~15s utterance cutoff; a real clip does not care either way.
  await speak(`It sounds like ${mnemonic.keyword_text}...`, 'en');
  await pauseMs(400);
  for (const sentence of splitIntoChunks(mnemonic.scene_description)) {
    await speak(sentence, 'en');
  }
}

function splitIntoChunks(text: string): string[] {
  // Split on sentence boundaries, keep chunks under ~100 chars
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (current.length + s.length > 100 && current.length > 0) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function playNarrationAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      currentAudio = null;
      reject(new Error('Narration audio playback failed'));
    };
    audio.play().catch((e) => {
      currentAudio = null;
      reject(e);
    });
  });
}

export function stopNarration(): void {
  speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
