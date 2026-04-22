'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InsightCard } from '@/components/ui/InsightCard';
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
    <div className="relative group">
      <Link
        href={`/tutor?mode=${nudge.suggestedMode}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-[18px] active:scale-[0.99] transition-transform"
      >
        <InsightCard foxPose="thinking">
          <InlineMarkdown text={nudge.message} />
        </InsightCard>
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss nudge"
        className="absolute top-2 right-2 w-6 h-6 rounded-full text-[color:var(--text-secondary)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center justify-center text-xs hover:text-[color:var(--foreground)]"
      >
        ×
      </button>
    </div>
  );
}
