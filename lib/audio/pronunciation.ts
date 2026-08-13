import type { PlaybackSpeed, SupportedLanguageCode, WordWithMnemonic } from '@/types/audio';
import {
  getPlaybackSpeed,
  setPlaybackSpeed,
  playAudioUrl,
  playAudioDirect,
  stopPlayback,
} from './player';
import { speak } from './voice';

// Re-exported so the many components importing these from here keep working;
// the implementations moved to player.ts to break the cycle with voice.ts.
export { getPlaybackSpeed, setPlaybackSpeed, playAudioDirect, stopPlayback };

const wordCache = new Map<string, WordWithMnemonic>();

// ---- Audio Unlock (browser autoplay policy) ----
// Browsers block HTMLAudioElement.play() and speechSynthesis until a user gesture.
// We listen for the first interaction, play a silent sound to "unlock" audio,
// and then all subsequent play() calls (including from useEffect) succeed.

let _audioUnlocked = false;
let _listenerAttached = false;
const _unlockCallbacks: (() => void)[] = [];

/** Whether the browser audio context has been unlocked by a user gesture. */
export function isAudioUnlocked(): boolean {
  return _audioUnlocked;
}

/**
 * Register a one-time callback that fires when audio is unlocked by user gesture.
 * If audio is already unlocked, the callback fires immediately.
 * Returns a cleanup function to remove the callback.
 */
export function onAudioUnlocked(callback: () => void): () => void {
  if (_audioUnlocked) {
    callback();
    return () => {};
  }
  _unlockCallbacks.push(callback);
  return () => {
    const idx = _unlockCallbacks.indexOf(callback);
    if (idx >= 0) _unlockCallbacks.splice(idx, 1);
  };
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

  // 3. Fire one-time unlock callbacks
  const callbacks = _unlockCallbacks.splice(0);
  for (const cb of callbacks) {
    try { cb(); } catch { /* ignore */ }
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
    return playViaTTS(options.text, options.languageCode);
  }

  // 3. Last resort: fetch from API (slow path)
  const word = await fetchWord(wordId);
  if (!word) return;

  if (word.pronunciation_audio_url) {
    try {
      return await playAudioUrl(word.pronunciation_audio_url, speed);
    } catch {
      // URL failed (e.g. blob storage outage), fall through to TTS
    }
  }

  return playViaTTS(word.text, word.language_code);
}

/**
 * Say text in the target language.
 *
 * Named "viaTTS" from when it meant the browser synthesiser and nothing else.
 * It now goes through the shared voice ladder, so the fallback path — a phrase
 * with no seeded clip, an info byte, a word added since the last seed run —
 * gets the same Neural voice as everything that was pre-generated, instead of
 * dropping to the robotic one.
 */
async function playViaTTS(
  text: string,
  langCode: SupportedLanguageCode,
  kind: 'word' | 'sentence' = 'word'
): Promise<void> {
  return speak(text, langCode, { kind });
}

interface PlayPhraseOptions {
  text: string;
  languageCode?: SupportedLanguageCode | string | null;
  rate?: PlaybackSpeed;
}

/**
 * Play a phrase: pre-generated audio URL first, then the voice ladder. The
 * phrases table is largely unseeded, so this fallback is the common path — it
 * is where most of the app's connected speech actually comes from.
 */
export async function playPhraseAudio(
  url: string | null | undefined,
  options: PlayPhraseOptions
): Promise<void> {
  stopPlayback();

  if (url) {
    try {
      return await playAudioUrl(url, options.rate ?? getPlaybackSpeed());
    } catch {
      // URL failed, fall through to TTS
    }
  }

  if (options.languageCode) {
    return playViaTTS(options.text, options.languageCode as SupportedLanguageCode, 'sentence');
  }
}

/**
 * Speak arbitrary target-language text. Used by surfaces without pre-seeded
 * audio (e.g. the daily info byte), which is exactly where the robotic voice
 * used to show up.
 */
export async function speakText(
  text: string,
  langCode: SupportedLanguageCode
): Promise<void> {
  stopPlayback();
  return playViaTTS(text, langCode, 'sentence');
}

/**
 * Preload audio URLs so they're warm in the browser HTTP cache by the time
 * the user actually triggers playback. Designed for the review queue —
 * call with the next N upcoming items' audio URLs and the audio element
 * for the active card will play instantly instead of waiting for a fresh
 * network round-trip.
 *
 * No-op on the server. Silently ignores invalid URLs.
 */
const _preloaded = new Set<string>();
export function preloadAudioUrls(urls: Array<string | null | undefined>): void {
  if (typeof window === 'undefined') return;
  for (const url of urls) {
    if (!url || _preloaded.has(url)) continue;
    _preloaded.add(url);
    try {
      const a = new Audio();
      a.preload = 'auto';
      a.src = url;
      // Triggers the fetch into HTTP cache; we don't keep the element.
      a.load();
    } catch {
      // ignore — preload is best-effort
    }
  }
}

// Expose cache for other modules (hands-free, scoring)
export { fetchWord };
