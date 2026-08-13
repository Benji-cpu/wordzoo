'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  attachAudioUnlockListener,
  isAudioUnlocked,
  onAudioUnlocked,
} from '@/lib/audio';

/**
 * "Talk to me" — one preference, read by every surface that can speak.
 *
 * Lives in context rather than being fetched per card because the surfaces
 * that need it (review cards, mnemonic images, phrase blocks, the tutor) are
 * scattered deep in client trees, and a card should not do a round-trip to
 * find out whether it is allowed to make a sound.
 *
 * Seeded from the server so the first card of a session already knows the
 * answer — reading it from localStorage on mount would mean every surface
 * either flickers into speaking or misses its first chance to.
 */

interface AudioPreferencesValue {
  /** Play target-language audio by itself when a card or image appears. */
  autoplay: boolean;
  setAutoplay: (next: boolean) => void;
  /**
   * True once a user gesture has unblocked audio. Autoplay is meaningless
   * before this — the browser silently refuses — so surfaces must check both.
   */
  unlocked: boolean;
}

/**
 * The unlock flag is external state that changes outside React — the gesture
 * that unblocks audio is usually a tap on something unrelated, screens away
 * from the card that wants to speak. Subscribing to it is what
 * `useSyncExternalStore` is for; an effect that read it and called setState
 * would be a cascading render on every mount.
 */
const unlockStore = {
  subscribe: (onChange: () => void) => onAudioUnlocked(onChange),
  getSnapshot: () => isAudioUnlocked(),
  // Nothing is unlocked during SSR, and claiming otherwise would hydrate into
  // a card trying to play audio the browser will refuse.
  getServerSnapshot: () => false,
};

const AudioPreferencesContext = createContext<AudioPreferencesValue>({
  autoplay: false,
  setAutoplay: () => {},
  unlocked: false,
});

export function AudioPreferencesProvider({
  initialAutoplay,
  children,
}: {
  initialAutoplay: boolean;
  children: React.ReactNode;
}) {
  const [autoplay, setAutoplayState] = useState(initialAutoplay);
  const unlocked = useSyncExternalStore(
    unlockStore.subscribe,
    unlockStore.getSnapshot,
    unlockStore.getServerSnapshot,
  );

  // Autoplay is the entire reason this listener has to be app-wide rather than
  // per-surface: whatever the learner tapped first is what buys the whole
  // session its permission to make sound.
  useEffect(() => {
    attachAudioUnlockListener();
  }, []);

  const setAutoplay = useCallback((next: boolean) => {
    // Local first, server second. Toggling a sound preference should take
    // effect on the very next card, not after a round-trip — and if the PATCH
    // fails the user still gets the behaviour they asked for this session.
    setAutoplayState(next);
    void fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { audio_autoplay: next } }),
    }).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ autoplay, setAutoplay, unlocked }),
    [autoplay, setAutoplay, unlocked],
  );

  return (
    <AudioPreferencesContext.Provider value={value}>
      {children}
    </AudioPreferencesContext.Provider>
  );
}

export function useAudioPreferences(): AudioPreferencesValue {
  return useContext(AudioPreferencesContext);
}

/**
 * Speak something once, when it appears, if the learner asked to be spoken to.
 *
 * `key` identifies the thing being spoken — change it and the new thing is
 * announced; leave it and a re-render stays quiet. Without that, every parent
 * state change would restart the audio mid-word.
 */
export function useAutoSpeak(key: string | null, play: () => void | Promise<void>): void {
  const { autoplay, unlocked } = useAudioPreferences();

  useEffect(() => {
    if (!autoplay || !unlocked || !key) return;
    let cancelled = false;
    // A beat after paint: speaking the instant a card mounts talks over the
    // transition, and reads as the app interrupting itself.
    const timer = setTimeout(() => {
      if (!cancelled) void play();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `play` is deliberately not a dependency — callers rebuild the closure
    // every render, and depending on it would replay on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, unlocked, key]);
}
