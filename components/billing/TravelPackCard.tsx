'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Path } from '@/types/database';

interface TravelPackCardProps {
  path: Path;
  wordCount: number;
  purchased?: boolean;
}

export function TravelPackCard({ path, wordCount, purchased = false }: TravelPackCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/travel-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: path.id }),
      });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{path.title}</h3>
            {purchased && <Badge variant="status">Unlocked</Badge>}
          </div>
          {path.description && (
            <p className="text-sm text-text-secondary mb-2">{path.description}</p>
          )}
          <p className="text-xs text-text-secondary">{wordCount} words</p>
        </div>
        {!purchased && (
          <Button size="sm" onClick={handleBuy} disabled={loading}>
            {loading ? 'Loading...' : '$4.99'}
          </Button>
        )}
      </div>
    </Card>
  );
}
