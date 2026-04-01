'use client';

import type { SuggestionOption } from '@/lib/tutor/message-parser';
import type { ChallengeMode } from '@/lib/tutor/modes';

interface SuggestionChipsProps {
  options: SuggestionOption[];
  onSelect: (text: string) => void;
  challengeMode?: ChallengeMode;
}

export function SuggestionChips({ options, onSelect, challengeMode = 'easy' }: SuggestionChipsProps) {
  if (options.length === 0 || challengeMode === 'hard') return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2 min-w-0">
      {options.map((option, i) => (
        <button
          key={option.text}
          onClick={() => onSelect(option.text)}
          className="px-3 py-2 rounded-xl border border-card-border bg-card-surface text-sm text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer animate-slide-up min-h-[44px] text-left"
          style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'backwards' }}
        >
          <span>{option.text}</span>
          {challengeMode === 'easy' && option.english && (
            <span className="block text-xs text-text-secondary mt-0.5">{option.english}</span>
          )}
        </button>
      ))}
    </div>
  );
}
