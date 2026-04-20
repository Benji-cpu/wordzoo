'use client';

import { useState, useCallback } from 'react';
import type { InsightDefinition } from '@/lib/insights/data';

interface InsightCardProps {
  insight: InsightDefinition;
  onDismiss: () => void;
}

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    // Fire API call to mark dismissed
    fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insightId: insight.id, action: 'dismissed' }),
    }).catch(() => {});
    // Wait for fade-out animation then notify parent
    setTimeout(onDismiss, 300);
  }, [insight.id, onDismiss]);

  return (
    <div
      className={`rounded-xl border border-purple-500/20 bg-purple-500/5 px-3.5 py-3 transition-all duration-300 ${
        dismissed ? 'opacity-0 scale-95' : 'animate-slide-up'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm">{insight.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-purple-300">
            {insight.title}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed mt-1">
            {insight.body}
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="mt-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
