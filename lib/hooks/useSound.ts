'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';

export type SoundName =
  | 'correct'
  | 'incorrect'
  | 'scene-complete'
  | 'streak-up'
  | 'level-up'
  | 'soft-tap'
  | 'reveal';

const STORAGE_KEY = 'wordzoo.sound_enabled';

/** Synthesized sounds via Web Audio — no external files. */
type Note = { freq: number; at: number; dur: number; gain?: number; type?: OscillatorType };
type Recipe = { notes: Note[]; tailMs: number };

const RECIPES: Record<SoundName, Recipe> = {
  correct: {
    notes: [
      { freq: 523.25, at: 0, dur: 0.08, gain: 0.22 }, // C5
      { freq: 659.25, at: 0.06, dur: 0.1, gain: 0.22 }, // E5
      { freq: 783.99, at: 0.12, dur: 0.16, gain: 0.24 }, // G5
    ],
    tailMs: 400,
  },
  incorrect: {
    notes: [
      { freq: 349.23, at: 0, dur: 0.08, gain: 0.18, type: 'triangle' }, // F4
      { freq: 293.66, at: 0.06, dur: 0.12, gain: 0.18, type: 'triangle' }, // D4
    ],
    tailMs: 260,
  },
  'scene-complete': {
    notes: [
      { freq: 523.25, at: 0, dur: 0.1, gain: 0.22 },
      { freq: 659.25, at: 0.1, dur: 0.1, gain: 0.22 },
      { freq: 783.99, at: 0.2, dur: 0.1, gain: 0.22 },
      { freq: 1046.5, at: 0.3, dur: 0.24, gain: 0.25 }, // C6
    ],
    tailMs: 700,
  },
  'streak-up': {
    notes: [
      { freq: 587.33, at: 0, dur: 0.08, gain: 0.22 }, // D5
      { freq: 880.0, at: 0.08, dur: 0.2, gain: 0.24 }, // A5
    ],
    tailMs: 400,
  },
  'level-up': {
    notes: [
      { freq: 523.25, at: 0, dur: 0.08, gain: 0.22 },
      { freq: 659.25, at: 0.08, dur: 0.08, gain: 0.22 },
      { freq: 783.99, at: 0.16, dur: 0.08, gain: 0.22 },
      { freq: 1046.5, at: 0.24, dur: 0.1, gain: 0.24 },
      { freq: 1318.51, at: 0.34, dur: 0.32, gain: 0.26 }, // E6
    ],
    tailMs: 800,
  },
  'soft-tap': {
    notes: [{ freq: 880, at: 0, dur: 0.04, gain: 0.1, type: 'triangle' }],
    tailMs: 80,
  },
  reveal: {
    notes: [
      { freq: 440, at: 0, dur: 0.06, gain: 0.16, type: 'sine' },
      { freq: 660, at: 0.05, dur: 0.12, gain: 0.18, type: 'sine' },
    ],
    tailMs: 240,
  },
};

function readEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === null ? true : v === '1';
}

function subscribe(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedCtx && sharedCtx.state !== 'closed') return sharedCtx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  sharedCtx = new Ctor();
  return sharedCtx;
}

function playRecipe(ctx: AudioContext, recipe: Recipe) {
  const start = ctx.currentTime + 0.02;
  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  for (const note of recipe.notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.type ?? 'sine';
    osc.frequency.value = note.freq;
    const peak = note.gain ?? 0.2;
    gain.gain.setValueAtTime(0.0001, start + note.at);
    gain.gain.exponentialRampToValueAtTime(peak, start + note.at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.at + note.dur);
    osc.connect(gain).connect(master);
    osc.start(start + note.at);
    osc.stop(start + note.at + note.dur + 0.02);
  }
}

/**
 * Synthesized SFX — no external audio files.
 * Respects a per-user setting in localStorage (Settings toggle writes
 * the same key via useSoundSetting).
 */
export function useSound() {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => true);
  const unlockedRef = useRef(false);

  const setEnabled = useCallback((next: boolean) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ preferences: { sound_enabled: next } }),
    }).catch(() => {});
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      // Resume context if needed (autoplay policy).
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      unlockedRef.current = true;
      const recipe = RECIPES[name];
      if (!recipe) return;
      try {
        playRecipe(ctx, recipe);
      } catch {
        // ignore transient scheduling errors
      }
    },
    [enabled],
  );

  return { play, enabled, setEnabled };
}
