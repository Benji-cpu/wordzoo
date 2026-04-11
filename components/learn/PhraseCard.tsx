'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { stopPlayback } from '@/lib/audio';
import type { ScenePhrase } from '@/types/database';

interface PhraseCardProps {
  phrase: ScenePhrase;
  onContinue: () => void;
}

function playAudioAtRate(url: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.playbackRate = rate;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio playback failed'));
    audio.play().catch(reject);
  });
}

export function PhraseCard({ phrase, onContinue }: PhraseCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const autoPlayedRef = useRef(false);

  // Auto-play audio when the card appears
  useEffect(() => {
    if (!phrase.audio_url || autoPlayedRef.current) return;
    autoPlayedRef.current = true;

    const timer = setTimeout(() => {
      setIsPlaying(true);
      playAudioAtRate(phrase.audio_url!, 1.0)
        .catch(() => {})
        .finally(() => setIsPlaying(false));
    }, 300); // Small delay for the card animation

    return () => clearTimeout(timer);
  }, [phrase.audio_url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPlayback();
  }, []);

  const handleReplay = useCallback(async (e: React.MouseEvent, rate = 1.0) => {
    e.stopPropagation();
    if (!phrase.audio_url) return;
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    try {
      await playAudioAtRate(phrase.audio_url, rate);
    } catch {
      // ignore
    } finally {
      setIsPlaying(false);
    }
  }, [phrase.audio_url, isPlaying]);

  const handleSlowReplay = useCallback((e: React.MouseEvent) => {
    handleReplay(e, 0.7);
  }, [handleReplay]);

  return (
    <Card className="text-center py-8 animate-slide-up" onClick={onContinue}>
      <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Key Phrase</p>
      <h2 className="text-3xl font-bold text-accent-id mb-2">{phrase.text_target}</h2>
      <p className="text-lg text-foreground mb-2">{phrase.text_en}</p>

      {phrase.audio_url && (
        <div className="flex items-center justify-center gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => handleReplay(e)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isPlaying
                ? 'bg-accent-id/20 text-accent-id border border-accent-id/40'
                : 'bg-card-surface text-text-secondary border border-card-border hover:border-accent-id/30'
            }`}
            aria-label={isPlaying ? 'Stop' : 'Replay'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" opacity={isPlaying ? 1 : 0.5} />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity={isPlaying ? 1 : 0.3} />
            </svg>
            {isPlaying ? 'Playing...' : 'Replay'}
          </button>
          <button
            type="button"
            onClick={handleSlowReplay}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-text-secondary bg-card-surface border border-card-border hover:border-accent-id/30 transition-colors"
            aria-label="Play at slow speed"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 8 14" />
            </svg>
            0.7x
          </button>
        </div>
      )}

      {phrase.literal_translation && (
        <p className="text-sm text-text-secondary italic mb-3">
          Literally: &ldquo;{phrase.literal_translation}&rdquo;
        </p>
      )}
      {phrase.usage_note && (
        <div className="bg-white/5 rounded-lg px-4 py-3 mx-auto max-w-sm mt-2">
          <p className="text-sm text-text-secondary">{phrase.usage_note}</p>
        </div>
      )}
      <p className="text-sm text-text-secondary mt-6">Tap to continue</p>
    </Card>
  );
}
