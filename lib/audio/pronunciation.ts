import type { PlaybackSpeed, SupportedLanguageCode, WordWithMnemonic } from '@/types/audio';
import { getVoiceForLanguage, speakWithPromise } from './voice-map';

const STORAGE_KEY = 'wordzoo_playback_speed';
const wordCache = new Map<string, WordWithMnemonic>();
let currentAudio: HTMLAudioElement | null = null;

// ---- Audio Unlock (browser autoplay policy) ----
// Browsers block HTMLAudioElement.play() and speechSynthesis until a user gesture.
// We listen for the first interaction, play a silent sound to "unlock" audio,
// and then all subsequent play() calls (including from useEffect) succeed.

let _audioUnlocked = false;
let _listenerAttached = false;

/** Whether the browser audio context has been unlocked by a user gesture. */
export function isAudioUnlocked(): boolean {
  return _audioUnlocked;
}

/** Play silent audio + empty utterance to satisfy browser autoplay policy. */
export function unlockAudio(): void {
  if (_audioUnlocked) return;
  _audioUnlocked = true;

  // 1. Silent WAV via HTMLAudioElement
  try {
    const silence = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    const audio = new Audio(silence);
    audio.volume = 0;
    audio.play().then(() => audio.pause()).catch(() => {});
  } catch {
    // ignore
  }

  // 2. Empty speechSynthesis utterance
  try {
    if (typeof speechSynthesis !== 'undefined') {
      const utt = new SpeechSynthesisUtterance('');
      utt.volume = 0;
      speechSynthesis.speak(utt);
      speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}

/**
 * Attach a one-time listener that unlocks audio on the first user interaction.
 * Safe to call multiple times — only one listener is ever attached.
 * Also pre-warms TTS voices after unlock.
 */
export function attachAudioUnlockListener(): void {
  if (_listenerAttached || typeof window === 'undefined') return;
  _listenerAttached = true;

  const events = ['click', 'touchstart', 'keydown'] as const;
  function onInteraction() {
    unlockAudio();
    events.forEach((e) => window.removeEventListener(e, onInteraction, true));

    // Pre-warm TTS voices so they're ready for the first real playback
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.getVoices();
    }
  }
  events.forEach((e) => window.addEventListener(e, onInteraction, { capture: true, once: false }));
}

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

interface PlayWordOptions {
  audioUrl?: string | null;
  text?: string;
  languageCode?: SupportedLanguageCode;
}

export async function playWordPronunciation(
  wordId: string,
  options?: PlayWordOptions
): Promise<void> {
  stopPlayback();

  const speed = getPlaybackSpeed();

  // 1. Try pre-generated audio URL
  if (options?.audioUrl) {
    try {
      return await playAudioUrl(options.audioUrl, speed);
    } catch {
      // URL failed, continue to fallbacks
    }
  }

  // 2. Try direct TTS (no API call needed)
  if (options?.text && options?.languageCode) {
    return playViaTTS(options.text, options.languageCode, speed);
  }

  // 3. Last resort: fetch from API (slow path)
  const word = await fetchWord(wordId);
  if (!word) return;

  if (word.pronunciation_audio_url) {
    return playAudioUrl(word.pronunciation_audio_url, speed);
  }

  return playViaTTS(word.text, word.language_code, speed);
}

/**
 * Play an audio URL directly without needing a word ID or API call.
 * Useful when the audio URL is already available from server-rendered data.
 */
export async function playAudioDirect(url: string): Promise<void> {
  stopPlayback();
  const speed = getPlaybackSpeed();
  return playAudioUrl(url, speed);
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
