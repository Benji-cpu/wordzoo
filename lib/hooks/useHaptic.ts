'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type HapticPattern = 'tap' | 'success' | 'error' | 'celebrate' | 'streak';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  success: [12, 40, 24],
  error: [16, 20, 40],
  celebrate: [10, 30, 10, 30, 18, 60],
  streak: [24, 60, 24, 60, 48],
};

const STORAGE_KEY = 'wordzoo.haptic_enabled';

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

/**
 * Thin wrapper over navigator.vibrate. Silently no-ops on unsupported
 * browsers (desktop, iOS Safari). Respects a per-user toggle persisted
 * in localStorage.
 */
export function useHaptic() {
  const enabled = useSyncExternalStore(
    subscribe,
    readEnabled,
    () => true, // server snapshot
  );

  const setEnabled = useCallback((next: boolean) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    // Fire a storage event for same-tab subscribers; same-tab events
    // don't populate newValue, so subscribers re-read from storage.
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    // Fire-and-forget: also persist cross-device via preferences API.
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ preferences: { haptic_enabled: next } }),
    }).catch(() => {});
  }, []);

  const trigger = useCallback(
    (pattern: HapticPattern = 'tap') => {
      if (!enabled) return;
      if (typeof window === 'undefined') return;
      const nav = window.navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
      if (typeof nav.vibrate !== 'function') return;
      try {
        nav.vibrate(PATTERNS[pattern]);
      } catch {
        // ignore
      }
    },
    [enabled],
  );

  return { trigger, enabled, setEnabled };
}
