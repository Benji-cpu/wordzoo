import type { PlaybackSpeed } from '@/types/audio';

/**
 * Playing a clip and stopping it — the layer with no opinion about what to say.
 *
 * Split out of pronunciation.ts so `voice.ts` can play a URL without importing
 * the module that decides *which* URL, which is what closed the import cycle:
 * pronunciation needs the voice ladder for its fallback, and the voice ladder
 * needs a way to play. Both now depend on this instead of on each other.
 *
 * pronunciation.ts re-exports everything here, so no call site had to change.
 */

const STORAGE_KEY = 'wordzoo_playback_speed';

let currentAudio: HTMLAudioElement | null = null;

export function getPlaybackSpeed(): PlaybackSpeed {
  if (typeof window === 'undefined') return 1.0;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === '0.5' || stored === '0.75' || stored === '1') {
    return parseFloat(stored) as PlaybackSpeed;
  }
  return 1.0;
}

export function setPlaybackSpeed(speed: PlaybackSpeed): void {
  localStorage.setItem(STORAGE_KEY, String(speed));
}

export function playAudioUrl(url: string, speed: PlaybackSpeed): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    // Brave's Shields can block cross-origin blob fetches; explicitly opting
    // into anonymous CORS lets the browser fetch the response with the same
    // headers our blob storage already serves. Safe for same-origin URLs too.
    audio.crossOrigin = 'anonymous';
    audio.src = url;
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

/** Play a URL we already have, at the user's chosen speed. */
export async function playAudioDirect(url: string): Promise<void> {
  stopPlayback();
  return playAudioUrl(url, getPlaybackSpeed());
}

export function stopPlayback(): void {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
