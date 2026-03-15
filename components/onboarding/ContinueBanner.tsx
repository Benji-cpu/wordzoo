'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOnboardingProgress, clearOnboardingProgress } from '@/lib/onboarding/state';

export default function ContinueBanner() {
  const [progress, setProgress] = useState<{ languageName: string; wordsLearned: number } | null>(null);

  useEffect(() => {
    setProgress(getOnboardingProgress());
  }, []);

  if (!progress) return null;

  return (
    <div className="glass-card p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-foreground font-medium">
          Continue learning {progress.languageName}?
        </p>
        <p className="text-sm text-text-secondary">
          You learned {progress.wordsLearned} word{progress.wordsLearned !== 1 ? 's' : ''}.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-500 transition-colors"
        >
          Continue
        </Link>
        <button
          onClick={() => {
            clearOnboardingProgress();
            setProgress(null);
          }}
          className="px-3 py-2 text-text-secondary text-sm hover:text-foreground/80 transition-colors cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
