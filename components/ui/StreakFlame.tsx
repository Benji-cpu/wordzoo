'use client';

type Props = {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
};

const SIZES = {
  sm: { w: 28, h: 32, fs: 12 },
  md: { w: 40, h: 48, fs: 15 },
  lg: { w: 64, h: 76, fs: 22 },
};

export function StreakFlame({
  count,
  size = 'md',
  active = true,
  className = '',
}: Props) {
  const { w, h, fs } = SIZES[size];
  const dim = !active || count === 0;
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`.trim()}
      aria-label={`${count}-day streak`}
    >
      <svg
        width={w}
        height={h}
        viewBox="0 0 40 48"
        className={dim ? '' : 'animate-flame-flicker'}
        aria-hidden
      >
        <defs>
          <radialGradient id="streak-grad" cx="50%" cy="70%" r="60%">
            <stop offset="0%" stopColor="var(--color-streak-core, #FFC93C)" />
            <stop offset="70%" stopColor="var(--color-streak-fire, #FF6B35)" />
            <stop offset="100%" stopColor="var(--color-fox-deep, #9A3412)" />
          </radialGradient>
        </defs>
        {/* Outer flame */}
        <path
          d="M 20 2 C 28 12 34 20 34 30 C 34 40 28 46 20 46 C 12 46 6 40 6 30 C 6 22 12 14 20 2 Z"
          fill={dim ? '#D6D3D1' : 'url(#streak-grad)'}
          opacity={dim ? 0.5 : 1}
        />
        {/* Inner flame */}
        <path
          d="M 20 14 C 24 20 28 26 28 32 C 28 38 24 42 20 42 C 16 42 12 38 12 32 C 12 28 16 22 20 14 Z"
          fill="var(--color-streak-core, #FFC93C)"
          opacity={dim ? 0 : 0.95}
        />
      </svg>
      <span
        className="font-bold tabular-nums"
        style={{ fontSize: fs, color: dim ? 'var(--text-secondary)' : 'var(--color-streak-fire, #FF6B35)' }}
      >
        {count}
      </span>
    </div>
  );
}
