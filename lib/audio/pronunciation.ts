import type { PlaybackSpeed, SupportedLanguageCode, WordWithMnemonic } from '@/types/audio';
import { getVoiceForLanguage, speakWithPromise } from './voice-map';

const STORAGE_KEY = 'wordzoo_playback_speed';
const wordCache = new Map<string, WordWithMnemonic>();
let currentAudio: HTMLAudioElement | null = null;

export function getPlaybackSpeed(): PlaybackSpeed {
  if (typeof window === 'undefined') return 1.0;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === '0.5' || stored === '0.75' || stored === '1') return parseFloat(stored) as PlaybackSpeed;
  return 1.0;
}

export function setPlaybackSpeed(speed: PlaybackSpeed): void {
  localStorage.setItem(STORAGE_KEY, String(speed));
}

async function fetchWord(wordId: string): Promise<WordWithMnemonic | null> {
  const cached = wordCache.get(wordId);
  if (cached) return cached;

  const res = await fetch(`/api/words/by-id/${wordId}`);
  if (!res.ok) return null;

  const json = await res.json();
  if (!json.data) return null;

  wordCache.set(wordId, json.data);
  return json.data as WordWithMnemonic;
}

export async function playWordPronunciation(wordId: string): Promise<void> {
  stopPlayback();

  const word = await fetchWord(wordId);
  if (!word) return;

  const speed = getPlaybackSpeed();

  if (word.pronunciation_audio_url) {
    return playAudioUrl(word.pronunciation_audio_url, speed);
  }

  return playViaTTS(word.text, word.language_code, speed);
}

function playAudioUrl(url: string, speed: PlaybackSpeed): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.playbackRate = speed;
    audio.onended = () => {
      currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      currentAudio = null;
      reject(new Error('Audio playback failed'));
    };
    audio.play().catch((e) => {
      currentAudio = null;
      reject(e);
    });
  });
}

async function playViaTTS(
  text: string,
  langCode: SupportedLanguageCode,
  speed: PlaybackSpeed
): Promise<void> {
  speechSynthesis.cancel();
  const voice = await getVoiceForLanguage(langCode);
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.rate = speed;
  return speakWithPromise(utterance);
}

export function stopPlayback(): void {
  speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

// Expose cache for other modules (hands-free, scoring)
export { fetchWord };
