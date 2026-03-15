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
};

export function useHandsFreeSession() {
  const [session, setSession] = useState<HandsFreeSession>(INITIAL_SESSION);
  const engineRef = useRef<HandsFreeEngine | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new HandsFreeEngine(setSession);
    }
    return engineRef.current;
  }, []);

  const start = useCallback(
    (wordIds: string[]) => {
      getEngine().start(wordIds);
    },
    [getEngine]
  );

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

  return { session, start, pause, resume, stop };
}
