'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { TappableWord } from '@/components/learn/TappableWord';
import { tokenizeDialogueLine } from '@/lib/utils/dialogue-tokenizer';
import { stopPlayback } from '@/lib/audio';
import type { SceneDialogue } from '@/types/database';
import type { LearnWord } from '@/components/learn/LearnClient';

interface DialoguePlayerProps {
  dialogues: SceneDialogue[];
  onComplete: () => void;
  onLineAdvance?: (lineIndex: number) => void;
  vocabWords?: LearnWord[];
  initialVisibleCount?: number;
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

/** Small speaker button for individual dialogue lines */
function LineAudioButton({ audioUrl, size = 16 }: { audioUrl: string; size?: number }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = useCallback(async (e: React.MouseEvent, rate = 1.0) => {
    e.stopPropagation();
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    try {
      await playAudioAtRate(audioUrl, rate);
    } catch {
      // ignore
    } finally {
      setIsPlaying(false);
    }
  }, [audioUrl, isPlaying]);

  const handleSlow = useCallback((e: React.MouseEvent) => {
    handlePlay(e, 0.7);
  }, [handlePlay]);

  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      <button
        type="button"
        onClick={(e) => handlePlay(e)}
        className="inline-flex items-center justify-center rounded-full p-1 text-accent-id hover:bg-white/10 active:bg-white/15 transition-colors"
        aria-label={isPlaying ? 'Playing' : 'Play audio'}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" opacity={isPlaying ? 1 : 0.4} />
        </svg>
      </button>
      <button
        type="button"
        onClick={handleSlow}
        className="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-text-secondary hover:bg-white/10 active:bg-white/15 transition-colors"
        aria-label="Play at slow speed"
      >
        0.7x
      </button>
    </span>
  );
}

export function DialoguePlayer({ dialogues, onComplete, onLineAdvance, vocabWords, initialVisibleCount = 1 }: DialoguePlayerProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [showCasual, setShowCasual] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const playAllAbortRef = useRef(false);
  const autoPlayedRef = useRef<Set<number>>(new Set());

  const hasInformalVariants = dialogues.some((d) => d.text_target_informal);
  const hasAnyAudio = dialogues.some((d) => d.audio_url);

  // Auto-play audio when a new line appears
  useEffect(() => {
    const lastIndex = visibleCount - 1;
    if (lastIndex < 0) return;
    if (autoPlayedRef.current.has(lastIndex)) return;
    const line = dialogues[lastIndex];
    if (!line?.audio_url) return;

    autoPlayedRef.current.add(lastIndex);
    playAudioAtRate(line.audio_url, 1.0).catch(() => {});
  }, [visibleCount, dialogues]);

  const handleTap = () => {
    if (isPlayingAll) return; // Don't advance during Play All
    if (visibleCount < dialogues.length) {
      const next = visibleCount + 1;
      setVisibleCount(next);
      onLineAdvance?.(next - 1);
    } else {
      onComplete();
    }
  };

  const handlePlayAll = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingAll) {
      playAllAbortRef.current = true;
      stopPlayback();
      setIsPlayingAll(false);
      return;
    }

    playAllAbortRef.current = false;
    setIsPlayingAll(true);

    // Show all lines first
    setVisibleCount(dialogues.length);

    for (let i = 0; i < dialogues.length; i++) {
      if (playAllAbortRef.current) break;
      const line = dialogues[i];
      if (!line.audio_url) continue;
      try {
        await playAudioAtRate(line.audio_url, 1.0);
        // Small pause between lines
        await new Promise(r => setTimeout(r, 400));
      } catch {
        // ignore
      }
    }

    setIsPlayingAll(false);
  }, [isPlayingAll, dialogues]);

  const getDisplayText = (line: SceneDialogue) => {
    if (showCasual && line.text_target_informal) {
      return line.text_target_informal;
    }
    return line.text_target;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playAllAbortRef.current = true;
      stopPlayback();
    };
  }, []);

  return (
    <div className="animate-slide-up" onClick={handleTap}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <p className="text-text-secondary text-sm">Listen to the conversation</p>
        {hasAnyAudio && (
          <button
            type="button"
            onClick={handlePlayAll}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isPlayingAll
                ? 'bg-accent-id/20 text-accent-id border border-accent-id/40'
                : 'bg-card-surface text-text-secondary border border-card-border hover:border-accent-id/30'
            }`}
          >
            {isPlayingAll ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                Stop
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Play All
              </>
            )}
          </button>
        )}
      </div>

      {hasInformalVariants && (
        <div className="flex justify-center mb-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowCasual((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              showCasual
                ? 'bg-accent-id/15 text-accent-id border border-accent-id/30'
                : 'bg-card-surface text-text-secondary border border-card-border'
            }`}
          >
            <span>{showCasual ? 'Casual' : 'Textbook'}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-60">
              <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {dialogues.slice(0, visibleCount).map((line, i) => {
          const isYou = line.speaker.toLowerCase() === 'you';
          const displayText = getDisplayText(line);
          return (
            <div
              key={line.id}
              className={`flex ${isYou ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`max-w-[85%] ${isYou ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <span className="text-xs text-text-secondary px-1">{line.speaker}</span>
                <Card className={`!p-3 ${isYou ? 'bg-accent-id/10 border-accent-id/30' : ''}`}>
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-base font-medium text-foreground flex-1">
                      {vocabWords && vocabWords.length > 0
                        ? tokenizeDialogueLine(displayText, vocabWords).map((seg, j) =>
                            seg.type === 'word' && seg.word ? (
                              <TappableWord key={j} word={seg.word}>{seg.text}</TappableWord>
                            ) : (
                              <span key={j}>{seg.text}</span>
                            )
                          )
                        : displayText}
                    </p>
                    {line.audio_url && (
                      <LineAudioButton audioUrl={line.audio_url} />
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{line.text_en}</p>
                  {showCasual && line.text_target_informal && (
                    <p className="text-xs text-text-secondary mt-1 italic">
                      Textbook: {line.text_target}
                    </p>
                  )}
                </Card>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-text-secondary">
        {isPlayingAll ? 'Playing all lines...' : visibleCount < dialogues.length ? 'Tap to continue' : 'Tap to move on'}
      </p>
    </div>
  );
}
