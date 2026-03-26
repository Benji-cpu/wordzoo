'use client';

import type { NudgeResult } from '@/lib/services/nudge-service';

interface TutorFABProps {
  onClick: () => void;
  activeNudge: NudgeResult | null;
  hidden: boolean;
}

export function TutorFAB({ onClick, activeNudge, hidden }: TutorFABProps) {
  if (hidden) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-[60] w-14 h-14 rounded-full bg-accent-default text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      aria-label="Open AI Tutor"
    >
      {/* Chat bubble icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>

      {/* Nudge indicator dot */}
      {activeNudge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-background animate-pulse" />
      )}
    </button>
  );
}
