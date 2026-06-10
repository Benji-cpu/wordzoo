import { levelFromXp } from '@/lib/xp/levels';

interface LevelBadgeProps {
  xpTotal: number;
}

/**
 * Compact level chip for the dashboard greeting row: progress ring,
 * "Lv N" and XP-to-next. Server-renderable — no client hooks.
 */
export function LevelBadge({ xpTotal }: LevelBadgeProps) {
  const { level, toNext, progress } = levelFromXp(xpTotal);

  const r = 9;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * Math.min(1, Math.max(0, progress));

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`Level ${level}, ${toNext} XP to next level`}
      title={`${toNext} XP to level ${level + 1}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        <circle
          cx="12" cy="12" r={r}
          fill="none"
          stroke="var(--color-fox-soft, #fde9d6)"
          strokeWidth="3"
        />
        <circle
          cx="12" cy="12" r={r}
          fill="none"
          stroke="var(--color-fox-primary, #F97316)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 12 12)"
        />
      </svg>
      <div className="leading-none">
        <div className="text-[13px] font-extrabold text-[color:var(--foreground)]">Lv {level}</div>
        <div className="text-[9.5px] font-bold text-[color:var(--text-secondary)] whitespace-nowrap">
          {toNext} XP to next
        </div>
      </div>
    </div>
  );
}
