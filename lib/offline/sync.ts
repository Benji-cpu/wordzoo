import { getPendingSync, removeSyncEvents, cacheUserWord } from './storage';
import type { SyncResult, CachedUserWord } from '@/types/offline';
import type { ApiResponse } from '@/types/api';

export async function syncWhenOnline(): Promise<SyncResult | null> {
  const events = await getPendingSync();
  if (events.length === 0) return null;

  const res = await fetch('/api/reviews/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });

  if (!res.ok) {
    throw new Error(`Sync failed: ${res.status}`);
  }

  const json: ApiResponse<SyncResult> = await res.json();
  if (json.error || !json.data) {
    throw new Error(json.error ?? 'Sync returned no data');
  }

  const result = json.data;

  // Remove successfully synced events
  const syncedIds = events.slice(0, result.synced + result.skipped).map((e) => e.id);
  if (syncedIds.length > 0) {
    await removeSyncEvents(syncedIds);
  }

  // Update local user words with server state
  for (const uw of result.updated_user_words) {
    const cached: CachedUserWord = { ...uw, cached_at: new Date() };
    await cacheUserWord(cached);
  }

  // Track last sync time
  localStorage.setItem('wordzoo-last-sync', new Date().toISOString());

  return result;
}

let isSyncing = false;

export function setupAutoSync(
  onSyncComplete?: (result: SyncResult | null) => void
): () => void {
  async function doSync() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const result = await syncWhenOnline();
      onSyncComplete?.(result);
    } catch {
      // Sync failed, will retry on next trigger
    } finally {
      isSyncing = false;
    }
  }

  const handleOnline = () => doSync();
  const handleFocus = () => {
    if (navigator.onLine) doSync();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('focus', handleFocus);

  // Initial sync attempt
  if (navigator.onLine) doSync();

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('focus', handleFocus);
  };
}
