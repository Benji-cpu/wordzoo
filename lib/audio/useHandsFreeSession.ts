'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { HandsFreeSession, SessionSummary } from '@/types/audio';
import { HandsFreeEngine } from './hands-free';

const INITIAL_SESSION: HandsFreeSession = {
  state: 'idle',
  currentWordIndex: 0,
  totalWords: 0,
  currentWord: null,
  isPaused: false,
  results: [],
  listenDeadline: null,
  error: null,
};

export function useHandsFreeSession() {
  const [session, setSession] = useState<HandsFreeSession>(INITIAL_SESSION);
  const engineRef = useRef<HandsFreeEngine | null>(null);
  /**
   * Mic loudness lives in a ref, not in state. It updates every animation
   * frame, and routing that through React would re-render the whole session
   * view ~60 times a second to move a few bars. The waveform reads it from its
   * own rAF loop instead.
   */
  const micLevelRef = useRef(0);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new HandsFreeEngine(setSession, (level) => {
        micLevelRef.current = level;
      });
    }
    return engineRef.current;
  }, []);

  const start = useCallback(
    (wordIds: string[]) => {
      // Nothing awaits this. Before it was caught, a rejection here left the
      // engine silent and the screen frozen mid-session — the engine now
      // reports failures through session.error, so this is belt and braces.
      void getEngine().start(wordIds).catch(() => {});
    },
    [getEngine]
  );

  const replay = useCallback(() => {
    void engineRef.current?.replay();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const stop = useCallback((): SessionSummary | null => {
    return engineRef.current?.stop() ?? null;
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  return { session, micLevelRef, start, pause, resume, stop, replay };
}
