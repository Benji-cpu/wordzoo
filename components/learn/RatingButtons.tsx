'use client';

import { useState } from 'react';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';

interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
}

const ratings: { value: Rating; label: string }[] = [
  { value: 'forgot', label: 'Again' },
  { value: 'hard', label: 'Hard' },
  { value: 'got_it', label: 'Good' },
  { value: 'instant', label: 'Easy' },
];

export function RatingButtons({ onRate }: RatingButtonsProps) {
  const [pressed, setPressed] = useState<Rating | null>(null);

  function handleRate(rating: Rating) {
    if (pressed) return;
    setPressed(rating);
    setTimeout(() => onRate(rating), 200);
  }

  return (
    <div className="flex gap-2 animate-slide-up">
      {ratings.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => handleRate(value)}
          disabled={pressed !== null}
          className={`flex-1 min-h-[44px] py-2.5 rounded-xl text-sm font-semibold border border-card-border bg-card-surface text-foreground transition-all ${
            pressed === value ? 'scale-95 bg-accent-default text-white border-accent-default' : 'active:scale-95 hover:bg-surface-inset'
          } ${pressed && pressed !== value ? 'opacity-40' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
