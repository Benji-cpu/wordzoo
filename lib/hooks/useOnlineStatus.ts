'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OfflineStatus } from '@/types/offline';

export function useOnlineStatus(): OfflineStatus & { checkConnectivity: () => Promise<boolean> } {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/session', { method: 'HEAD' });
      const online = res.ok;
      setIsOnline(online);
      return online;
    } catch {
      setIsOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    // Initialize from navigator
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Poll pending sync count
  useEffect(() => {
    let mounted = true;

    async function pollPendingCount() {
      try {
        const { getPendingSync } = await import('@/lib/offline/storage');
        const events = await getPendingSync();
        if (mounted) setPendingSyncCount(events.length);
      } catch {
        // Storage not available
      }
    }

    pollPendingCount();
    const interval = setInterval(pollPendingCount, 30_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Track last sync from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('wordzoo-last-sync');
    if (stored) setLastSyncAt(new Date(stored));
  }, []);

  return { isOnline, pendingSyncCount, lastSyncAt, checkConnectivity };
}
