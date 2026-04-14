'use client';

interface PacingNudgeProps {
  wordsLearnedToday: number;
  scenesCompletedToday: number;
}

type PacingLevel = 'green' | 'yellow' | 'orange' | 'red';

function getPacingLevel(words: number): PacingLevel {
  if (words <= 12) return 'green';
  if (words <= 20) return 'yellow';
  if (words <= 30) return 'orange';
  return 'red';
}

const levelConfig: Record<PacingLevel, { bg: string; border: string; icon: string; textColor: string }> = {
  green: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: '📊',
    textColor: 'text-emerald-400',
  },
  yellow: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: '💡',
    textColor: 'text-amber-400',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: '🔄',
    textColor: 'text-orange-400',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: '⚠️',
    textColor: 'text-red-400',
  },
};

function getMessage(level: PacingLevel, words: number): string {
  switch (level) {
    case 'green':
      return `${words} new word${words !== 1 ? 's' : ''} today`;
    case 'yellow':
      return 'Great session! A quick review helps these stick';
    case 'orange':
      return `${words} words today — reviewing now locks these in`;
    case 'red':
      return 'Most people retain fewer than half at this pace';
  }
}

export function PacingNudge({ wordsLearnedToday, scenesCompletedToday }: PacingNudgeProps) {
  const level = getPacingLevel(wordsLearnedToday);
  const config = levelConfig[level];
  const message = getMessage(level, wordsLearnedToday);

  if (wordsLearnedToday === 0) return null;

  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} px-3 py-2.5 flex items-start gap-2.5`}>
      <span className="text-base leading-none mt-0.5">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
        {scenesCompletedToday > 0 && level === 'green' && (
          <p className="text-xs text-text-secondary mt-0.5">
            {scenesCompletedToday} scene{scenesCompletedToday !== 1 ? 's' : ''} completed
          </p>
        )}
      </div>
    </div>
  );
}

export { getPacingLevel };
export type { PacingLevel };
