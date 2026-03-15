'use client';

import { useEffect } from 'react';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed — likely not HTTPS or dev mode
      });
    }

    // Setup auto sync
    let cleanup: (() => void) | undefined;

    import('@/lib/offline/sync').then(({ setupAutoSync }) => {
      cleanup = setupAutoSync();
    }).catch(() => {
      // Sync module not available
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return <>{children}</>;
}
