'use client';

import { useState, useEffect } from 'react';
import { InsightCard } from '@/components/insights/InsightCard';
import type { InsightDefinition } from '@/lib/insights/data';

interface DashboardInsightProps {
  insight: InsightDefinition;
}

export function DashboardInsight({ insight }: DashboardInsightProps) {
  const [visible, setVisible] = useState(true);

  // Mark as shown on mount
  useEffect(() => {
    fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insightId: insight.id, action: 'shown' }),
    }).catch(() => {});
  }, [insight.id]);

  if (!visible) return null;

  return (
    <InsightCard insight={insight} onDismiss={() => setVisible(false)} />
  );
}
