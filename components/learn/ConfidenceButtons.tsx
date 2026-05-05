'use client';

import { useState } from 'react';
import { fireTelemetry } from '@/lib/pedagogy/telemetry';

interface ConfidenceButtonsProps {
  wordId: string;
  cueType: string;
  /**
   * Fired when the learner picks. `'guessed'` means the answer was a lucky
   * guess and the item should resurface in this session at lower priority.
   */
  onPick: (confidence: 'knew_it' | 'guessed') => void;
}

/**
 * Optional inline pair shown after a first-attempt correct answer. Lets the
 * learner self-report whether they truly knew it or guessed — guessed
 * answers map to SRS rating 'hard' (smaller interval bump) and re-queue.
 */
export function ConfidenceButtons({ wordId, cueType, onPick }: ConfidenceButtonsProps) {
  const [picked, setPicked] = useState<'knew_it' | 'guessed' | null>(null);

  function handle(choice: 'knew_it' | 'guessed') {
    if (picked) return;
    setPicked(choice);
    fireTelemetry({
      event: choice === 'knew_it' ? 'drill_correct' : 'drill_wrong',
      payload: { wordId, cueType, confidence: choice },
    });
    onPick(choice);
  }

  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => handle('knew_it')}
        disabled={!!picked}
        className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${picked === 'knew_it' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500' : 'border-card-border text-text-secondary hover:bg-surface-inset disabled:opacity-50'}`}
      >
        I knew it
      </button>
      <button
        type="button"
        onClick={() => handle('guessed')}
        disabled={!!picked}
        className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${picked === 'guessed' ? 'bg-amber-500/15 border-amber-500/40 text-amber-500' : 'border-card-border text-text-secondary hover:bg-surface-inset disabled:opacity-50'}`}
      >
        I guessed
      </button>
    </div>
  );
}
