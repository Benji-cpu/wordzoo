'use client';

import { useState } from 'react';

type Variant = 'correct' | 'scene-complete' | 'streak-milestone';

type Props = {
  active: boolean;
  variant?: Variant;
  particleCount?: number;
  className?: string;
};

function buildParticles(count: number, variant: Variant) {
  const palette = COLORS[variant];
  return Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2 + (i * 0.37);
    const distance = 120 + Math.random() * 140;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance + 80;
    const color = palette[i % palette.length];
    const delay = Math.random() * 120;
    const rot = Math.random() * 360;
    const size = 6 + Math.random() * 6;
    const shape = i % 3 === 0 ? '50%' : '2px';
    return { dx, dy, color, delay, rot, size, shape, key: i };
  });
}

const COLORS: Record<Variant, string[]> = {
  correct: [
    'var(--color-celebrate-green, #22C55E)',
    'var(--color-celebrate-gold, #FBBF24)',
  ],
  'scene-complete': [
    'var(--color-celebrate-gold, #FBBF24)',
    'var(--color-celebrate-pink, #EC4899)',
    'var(--color-celebrate-cyan, #06B6D4)',
    'var(--color-celebrate-violet, #8B5CF6)',
    'var(--color-fox-primary, #F97316)',
  ],
  'streak-milestone': [
    'var(--color-streak-fire, #FF6B35)',
    'var(--color-streak-core, #FFC93C)',
    'var(--color-celebrate-gold, #FBBF24)',
  ],
};

/**
 * Lightweight confetti burst — pure CSS particle animation. Each
 * particle gets randomized --dx/--dy offsets via inline style and
 * falls using the confetti-fall keyframe (globals.css).
 *
 * Renders absolutely so the parent positions it. Set `active` true
 * to play, false to unmount.
 */
export function Celebration({
  active,
  variant = 'correct',
  particleCount,
  className = '',
}: Props) {
  const count = particleCount ?? (variant === 'correct' ? 14 : 32);

  if (!active) return null;
  // Render a child that computes its particles once on mount. Remount
  // happens naturally each time `active` flips back to true because
  // this branch is conditionally rendered.
  return (
    <Burst
      count={count}
      variant={variant}
      className={className}
    />
  );
}

function Burst({
  count,
  variant,
  className,
}: {
  count: number;
  variant: Variant;
  className: string;
}) {
  // Lazy initializer — evaluated once on mount, never re-runs. Keeps
  // random values out of render.
  const [particles] = useState(() => buildParticles(count, variant));
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-visible motion-reduce:hidden ${className}`.trim()}
    >
      {particles.map((p) => (
        <span
          key={p.key}
          className="absolute left-1/2 top-1/2 block"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape,
            transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
            animation: `confetti-fall 900ms var(--ease-out-back) ${p.delay}ms forwards`,
            // CSS custom props consumed by the keyframe
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
}
