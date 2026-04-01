'use client';

import type { ChallengeMode } from '@/lib/tutor/modes';

const MODES: { value: ChallengeMode; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Med' },
  { value: 'hard', label: 'Hard' },
];

interface ChallengeModeToggleProps {
  mode: ChallengeMode;
  onChange: (mode: ChallengeMode) => void;
}

export function ChallengeModeToggle({ mode, onChange }: ChallengeModeToggleProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-1.5 border-b border-card-border bg-black/[0.02] dark:bg-white/[0.02]">
      <span className="text-xs text-text-secondary mr-1.5 shrink-0">Challenge:</span>
      <div className="flex rounded-lg overflow-hidden border border-card-border">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === value
                ? 'bg-accent-default text-white'
                : 'bg-card-surface text-text-secondary hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
