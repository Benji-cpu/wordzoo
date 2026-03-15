'use client';

import { useState } from 'react';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';

interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
}

const ratings: { value: Rating; label: string; color: string }[] = [
  { value: 'forgot', label: 'Forgot', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'hard', label: 'Hard', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'got_it', label: 'Got it', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'instant', label: 'Instant', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
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
      {ratings.map(({ value, label, color }) => (
        <button
          key={value}
          onClick={() => handleRate(value)}
          disabled={pressed !== null}
          className={`flex-1 min-h-[44px] py-3 rounded-xl text-sm font-medium border transition-all ${color} ${
            pressed === value ? 'scale-95' : 'active:scale-95'
          } ${pressed && pressed !== value ? 'opacity-40' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
