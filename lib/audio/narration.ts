import type { Mnemonic } from '@/types/database';
import { getEnglishVoice, speakWithPromise, pauseMs } from './voice-map';

let currentAudio: HTMLAudioElement | null = null;

export async function narrateMnemonic(
  mnemonic: Pick<Mnemonic, 'keyword_text' | 'scene_description' | 'audio_url'>
): Promise<void> {
  stopNarration();

  if (mnemonic.audio_url) {
    return playNarrationAudio(mnemonic.audio_url);
  }

  const voice = await getEnglishVoice();

  // Keyword introduction
  const keywordUtterance = new SpeechSynthesisUtterance(
    `It sounds like ${mnemonic.keyword_text}...`
  );
  if (voice) keywordUtterance.voice = voice;
  keywordUtterance.rate = 0.95;
  keywordUtterance.pitch = 1.1;
  await speakWithPromise(keywordUtterance);

  await pauseMs(500);

  // Scene description — split long text to avoid Chrome's ~15s cutoff
  const sentences = splitIntoChunks(mnemonic.scene_description);
  for (const sentence of sentences) {
    const sceneUtterance = new SpeechSynthesisUtterance(sentence);
    if (voice) sceneUtterance.voice = voice;
    sceneUtterance.rate = 0.9;
    await speakWithPromise(sceneUtterance);
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
