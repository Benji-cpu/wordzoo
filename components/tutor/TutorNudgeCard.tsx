'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { InlineMarkdown } from '@/components/ui/InlineMarkdown';

interface NudgeData {
  id: string;
  message: string;
  suggestedMode: string;
}

interface TutorNudgeCardProps {
  languageId: string;
}

export function TutorNudgeCard({ languageId }: TutorNudgeCardProps) {
  const [nudge, setNudge] = useState<NudgeData | null>(null);

  useEffect(() => {
    async function fetchNudge() {
      try {
        const res = await fetch(`/api/tutor/nudge?languageId=${languageId}&page=dashboard`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) setNudge(json.data);
        }
      } catch {
        // Non-critical
      }
    }
    fetchNudge();
  }, [languageId]);

  async function handleDismiss() {
    if (!nudge) return;
    setNudge(null);
    try {
      await fetch('/api/tutor/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudgeId: nudge.id, action: 'dismissed' }),
      });
    } catch {
      // Non-critical
    }
  }

  if (!nudge) return null;

  return (
    <Card className="animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-accent-default/20 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-default">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground"><InlineMarkdown text={nudge.message} /></p>
          <div className="flex gap-2 mt-2">
            <Link
              href={`/tutor?mode=${nudge.suggestedMode}`}
              className="px-3 py-1.5 rounded-lg bg-accent-default text-white text-xs font-medium hover:bg-accent-default/90 transition-colors"
            >
              Start
            </Link>
            <button
              onClick={handleDismiss}
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
