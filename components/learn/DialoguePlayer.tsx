'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import type { SceneDialogue } from '@/types/database';

interface DialoguePlayerProps {
  dialogues: SceneDialogue[];
  onComplete: () => void;
  onLineAdvance?: (lineIndex: number) => void;
}

export function DialoguePlayer({ dialogues, onComplete, onLineAdvance }: DialoguePlayerProps) {
  const [visibleCount, setVisibleCount] = useState(1);

  const handleTap = () => {
    if (visibleCount < dialogues.length) {
      const next = visibleCount + 1;
      setVisibleCount(next);
      onLineAdvance?.(next - 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="animate-slide-up" onClick={handleTap}>
      <p className="text-center text-text-secondary text-sm mb-4">Listen to the conversation</p>
      <div className="space-y-3 mb-6">
        {dialogues.slice(0, visibleCount).map((line, i) => {
          const isYou = line.speaker.toLowerCase() === 'you';
          return (
            <div
              key={line.id}
              className={`flex ${isYou ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`max-w-[85%] ${isYou ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <span className="text-xs text-text-secondary px-1">{line.speaker}</span>
                <Card className={`!p-3 ${isYou ? 'bg-accent-id/10 border-accent-id/30' : ''}`}>
                  <p className="text-base font-medium text-foreground">{line.text_target}</p>
                  <p className="text-sm text-text-secondary mt-1">{line.text_en}</p>
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
