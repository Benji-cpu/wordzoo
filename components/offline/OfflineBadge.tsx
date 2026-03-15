'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';

interface OfflineBadgeProps {
  pathId: string;
}

export function OfflineBadge({ pathId }: OfflineBadgeProps) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const { isFullyOffline } = await import('@/lib/offline/cache-manager');
        const result = await isFullyOffline(pathId);
        if (mounted) setIsOffline(result);
      } catch {
        // Cache manager not available
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, [pathId]);

  if (!isOffline) return null;

  return (
    <Badge color="bg-green-500/20 text-green-400">
      Available offline
    </Badge>
  );
}
