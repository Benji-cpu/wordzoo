'use client';

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
      Offline
      {pendingSyncCount > 0 && (
        <span className="text-yellow-400/70">({pendingSyncCount})</span>
      )}
    </div>
  );
}
