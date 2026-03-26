'use client';

import { Card } from '@/components/ui/Card';
import { useTutorContext } from '@/lib/hooks/useTutorContext';

export function TutorNudgeCard() {
  const { activeNudge, openPanel, dismissNudge } = useTutorContext();

  if (!activeNudge) return null;

  return (
    <Card className="animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-accent-default/20 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-default">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{activeNudge.message}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => openPanel(activeNudge.suggestedMode)}
              className="px-3 py-1.5 rounded-lg bg-accent-default text-white text-xs font-medium hover:bg-accent-default/90 transition-colors"
            >
              Start
            </button>
            <button
              onClick={dismissNudge}
              className="px-3 py-1.5 rounded-lg bg-card-surface border border-card-border text-text-secondary text-xs hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
