'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'wordzoo-tutor-onboarded';

interface TutorOnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: 'Meet Your AI Tutor',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 sm:w-12 sm:h-12 text-accent-default">
        <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <path d="M12 19v3" />
        <circle cx="12" cy="12" r="10" strokeDasharray="4 4" opacity="0.3" />
      </svg>
    ),
    description: 'Your personal language partner that adapts to your level.',
    bullets: [
      'Practice real conversations in your target language',
      'Get gentle corrections when you make mistakes',
      'Learn new vocabulary in context',
    ],
  },
  {
    title: 'How It Works',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 sm:w-12 sm:h-12 text-accent-default">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8" />
        <path d="M8 13h6" />
      </svg>
    ),
    description: 'Chat naturally — type, speak, or tap quick replies.',
    bullets: [
      'Suggestion chips give you quick reply options',
      'Tap any word in a message to see its meaning',
      'Choose different modes for different skills',
    ],
  },
];

export function TutorOnboarding({ onComplete }: TutorOnboardingProps) {
  const [step, setStep] = useState(0);

  function handleNext() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
    onComplete();
  }

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col items-center justify-center px-4 safe-area-bottom animate-fade-in">
      <div className="glass-card p-5 sm:p-6 w-full max-w-md space-y-4 sm:space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">{current.icon}</div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground">{current.title}</h2>

        {/* Description */}
        <p className="text-text-secondary text-sm">{current.description}</p>

        {/* Bullets */}
        <ul className="space-y-2 sm:space-y-3 text-left">
          {current.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm text-foreground">
              <span className="text-accent-default mt-0.5 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {bullet}
            </li>
          ))}
        </ul>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-accent-default' : 'bg-card-border'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button onClick={handleNext} className="w-full">
            {step < steps.length - 1 ? 'Next' : 'Get Started'}
          </Button>
          {step < steps.length - 1 && (
            <button
              onClick={finish}
              className="text-sm text-text-secondary hover:text-foreground transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { STORAGE_KEY as TUTOR_ONBOARDED_KEY };
