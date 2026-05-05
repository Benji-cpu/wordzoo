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

const levelConfig: Record<PacingLevel, { bg: string; border: string; textColor: string; iconColor: string }> = {
  green: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    textColor: 'text-emerald-400',
    iconColor: 'text-emerald-400',
  },
  yellow: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-400',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    textColor: 'text-orange-400',
    iconColor: 'text-orange-400',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    textColor: 'text-red-400',
    iconColor: 'text-red-400',
  },
};

function getMessage(level: PacingLevel, words: number): { eyebrow: string; primary: string } {
  switch (level) {
    case 'green':
      return {
        eyebrow: 'Today',
        primary: `${words} new word${words !== 1 ? 's' : ''}`,
      };
    case 'yellow':
      return {
        eyebrow: 'Great session',
        primary: 'A quick review helps these stick',
      };
    case 'orange':
      return {
        eyebrow: `${words} words today`,
        primary: 'Reviewing now locks these in',
      };
    case 'red':
      return {
        eyebrow: 'Heads up',
        primary: 'Most people retain fewer than half at this pace',
      };
  }
}

function PaceIcon({ level, className }: { level: PacingLevel; className: string }) {
  // Soft, brand-leaning line icons — replaces the prior emoji set so the
  // pacing strip reads as part of the WordZoo language, not a generic chip.
  if (level === 'green') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (level === 'yellow') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 18h6" /><path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3v1h6v-1c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2Z" />
      </svg>
    );
  }
  if (level === 'orange') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 9v4" /><path d="M12 17h.01" />
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}

export function PacingNudge({ wordsLearnedToday, scenesCompletedToday }: PacingNudgeProps) {
  const level = getPacingLevel(wordsLearnedToday);
  const config = levelConfig[level];
  const { eyebrow, primary } = getMessage(level, wordsLearnedToday);

  if (wordsLearnedToday === 0) return null;

  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} px-3.5 py-2.5 flex items-center gap-3`}>
      <PaceIcon level={level} className={`w-5 h-5 shrink-0 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${config.textColor} opacity-80`}>{eyebrow}</p>
        <p className={`text-sm font-semibold ${config.textColor} leading-snug`}>{primary}</p>
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
