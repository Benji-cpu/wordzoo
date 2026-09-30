'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playPhraseAudio, playWordPronunciation, stopPlayback } from '@/lib/audio/pronunciation';
import type { SupportedLanguageCode } from '@/types/audio';
import type { ItemView } from './item-view';

/**
 * Play an item's target audio: the pre-generated clip first, then the voice
 * ladder (see lib/audio/pronunciation.ts). `play` resolves true when playback
 * ran, false when nothing could be played, so a listen card can show the text.
 * Leaving the card stops whatever is playing.
 */
export function useItemAudio(view: ItemView, languageCode: string | null) {
  const [playing, setPlaying] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopPlayback();
    };
  }, []);

  const play = useCallback(async (): Promise<boolean> => {
    setPlaying(true);
    try {
      if (view.kind === 'word') {
        await playWordPronunciation(view.id, {
          audioUrl: view.audioUrl,
          text: view.text,
          languageCode: (languageCode ?? undefined) as SupportedLanguageCode | undefined,
        });
      } else {
        await playPhraseAudio(view.audioUrl, { text: view.text, languageCode });
      }
      return true;
    } catch {
      return false;
    } finally {
      if (alive.current) setPlaying(false);
    }
  }, [view.kind, view.id, view.audioUrl, view.text, languageCode]);

  return { play, playing };
}
