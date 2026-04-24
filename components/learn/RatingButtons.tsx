'use client';

import { useState } from 'react';
import { useHaptic } from '@/lib/hooks/useHaptic';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';

interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
}

interface RatingTone {
  /** Inactive background (cream + subtle tint so the scale reads at a glance) */
  rest: string;
  /** Pressed background */
  active: string;
  /** Text colour on rest */
  text: string;
}

const TONE: Record<Rating, RatingTone> = {
  forgot: {
    rest: 'color-mix(in srgb, var(--color-error) 10%, var(--card-surface))',
    active: 'var(--color-error)',
    text: 'color-mix(in srgb, var(--color-error) 80%, var(--foreground))',
  },
  hard: {
    rest: 'color-mix(in srgb, var(--color-warning) 12%, var(--card-surface))',
    active: 'var(--color-warning)',
    text: 'color-mix(in srgb, var(--color-warning) 75%, var(--foreground))',
  },
  got_it: {
    rest: 'color-mix(in srgb, var(--color-success) 10%, var(--card-surface))',
    active: 'var(--color-success)',
    text: 'color-mix(in srgb, var(--color-success) 70%, var(--foreground))',
  },
  instant: {
    rest: 'var(--accent-indonesian-soft)',
    active: 'var(--accent-indonesian)',
    text: 'var(--accent-indonesian)',
  },
};

const RATINGS: { value: Rating; label: string }[] = [
  { value: 'forgot', label: 'Again' },
  { value: 'hard', label: 'Hard' },
  { value: 'got_it', label: 'Good' },
  { value: 'instant', label: 'Easy' },
];

export function RatingButtons({ onRate }: RatingButtonsProps) {
  const [pressed, setPressed] = useState<Rating | null>(null);
  const { trigger } = useHaptic();

  function handleRate(rating: Rating) {
    if (pressed) return;
    setPressed(rating);
    trigger('tap');
    setTimeout(() => onRate(rating), 220);
  }

  return (
    <div className="flex gap-2 animate-slide-up">
      {RATINGS.map(({ value, label }) => {
        const tone = TONE[value];
        const isPressed = pressed === value;
        const isDimmed = pressed !== null && pressed !== value;

        const style: React.CSSProperties = {
          background: isPressed ? tone.active : tone.rest,
          color: isPressed ? '#fff' : tone.text,
          borderColor: 'transparent',
        };

        return (
          <button
            key={value}
            type="button"
            onClick={() => handleRate(value)}
            disabled={pressed !== null}
            style={style}
            className={`flex-1 min-h-[52px] px-2 rounded-[16px] text-[13px] font-extrabold tracking-wide transition-[transform,background-color,color,opacity] duration-[var(--duration-micro)] ease-[var(--ease-spring)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
              isPressed ? 'scale-95' : ''
            } ${isDimmed ? 'opacity-40' : ''}`}
            aria-label={`Rate: ${label}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
