'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { TappableWord } from '@/components/learn/TappableWord';
import { tokenizeDialogueLine } from '@/lib/utils/dialogue-tokenizer';
import type { SceneDialogue } from '@/types/database';
import type { LearnWord } from '@/components/learn/LearnClient';

interface DialoguePlayerProps {
  dialogues: SceneDialogue[];
  onComplete: () => void;
  onLineAdvance?: (lineIndex: number) => void;
  vocabWords?: LearnWord[];
  initialVisibleCount?: number;
}

export function DialoguePlayer({ dialogues, onComplete, onLineAdvance, vocabWords, initialVisibleCount = 1 }: DialoguePlayerProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [showCasual, setShowCasual] = useState(false);

  const hasInformalVariants = dialogues.some((d) => d.text_target_informal);

  const handleTap = () => {
    if (visibleCount < dialogues.length) {
      const next = visibleCount + 1;
      setVisibleCount(next);
      onLineAdvance?.(next - 1);
    } else {
      onComplete();
    }
  };

  const getDisplayText = (line: SceneDialogue) => {
    if (showCasual && line.text_target_informal) {
      return line.text_target_informal;
    }
    return line.text_target;
  };

  return (
    <div className="animate-slide-up" onClick={handleTap}>
      <p className="text-center text-text-secondary text-sm mb-4">Listen to the conversation</p>

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
                  <p className="text-base font-medium text-foreground">
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
        {visibleCount < dialogues.length ? 'Tap to continue' : 'Tap to move on'}
      </p>
    </div>
  );
}
