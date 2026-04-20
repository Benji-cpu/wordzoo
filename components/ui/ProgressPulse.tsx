'use client';

type Props = {
  value: number; // 0..1
  /** Optional milestone positions (0..1) to mark on the bar */
  milestones?: number[];
  height?: number;
  className?: string;
  showPercent?: boolean;
  color?: string;
};

/**
 * Playful progress bar — gradient fill with a subtle shine pass. Used
 * for scene progress, daily goal, streak progress, etc.
 */
export function ProgressPulse({
  value,
  milestones,
  height = 10,
  className = '',
  showPercent = false,
  color,
}: Props) {
  const pct = Math.max(0, Math.min(1, value));
  const percent = Math.round(pct * 100);
  const fill =
    color ??
    `linear-gradient(90deg, var(--color-fox-primary, #F97316), var(--color-celebrate-gold, #FBBF24))`;
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="relative w-full overflow-hidden rounded-full bg-[var(--surface-inset)]"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%`, background: fill }}
        />
        {milestones?.map((m, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-0 h-full w-0.5 bg-white/60"
            style={{ left: `${Math.max(0, Math.min(1, m)) * 100}%` }}
          />
        ))}
      </div>
      {showPercent ? (
        <div className="mt-1 text-xs font-medium text-text-secondary tabular-nums">
          {percent}%
        </div>
      ) : null}
    </div>
  );
}
