import {
  getCachedPath,
  getAllCachedWordIds,
  estimateStoreSize,
  deleteOldWords,
  cacheWord,
  cacheMnemonic,
  cacheAudio,
} from './storage';
import type { CacheStats, CacheCleanResult, CachedWord, CachedMnemonic, CachedAudio } from '@/types/offline';
import type { ApiResponse } from '@/types/api';

const MAX_CACHE_BYTES = 200 * 1024 * 1024; // 200MB

export async function getCacheSize(): Promise<CacheStats> {
  let totalBytes = 0;
  const breakdown = { images: 0, audio: 0, data: 0 };

  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      totalBytes = estimate.usage ?? 0;
    }
  } catch {
    // Fallback to store estimation
  }

  // Per-store breakdown
  try {
    breakdown.images = await estimateStoreSize('mnemonics');
    breakdown.audio = await estimateStoreSize('audio');
    breakdown.data =
      (await estimateStoreSize('words')) +
      (await estimateStoreSize('user_words')) +
      (await estimateStoreSize('paths'));

    if (totalBytes === 0) {
      totalBytes = breakdown.images + breakdown.audio + breakdown.data;
    }
  } catch {
    // Storage estimation failed
  }

  const wordIds = await getAllCachedWordIds();
  const lastSyncStr = localStorage.getItem('wordzoo-last-sync');

  return {
    totalBytes,
    breakdown,
    cachedWords: wordIds.length,
    lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
  };
}

export async function cleanOldCache(daysToKeep = 90): Promise<CacheCleanResult> {
  const stats = await getCacheSize();

  if (stats.totalBytes < MAX_CACHE_BYTES) {
    return { deletedWords: 0, deletedMnemonics: 0, deletedAudio: 0, freedBytes: 0 };
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const deletedWords = await deleteOldWords(cutoff);

  // Estimate freed bytes
  const freedBytes = deletedWords * 5000; // ~5KB per word average

  return {
    deletedWords,
    deletedMnemonics: 0, // Could be extended to clean orphaned mnemonics
    deletedAudio: 0,
    freedBytes,
  };
}

export async function isFullyOffline(pathId: string): Promise<boolean> {
  const cached = await getCachedPath(pathId);
  return cached?.is_fully_offline ?? false;
}

export async function getCacheStatus(
  pathId: string
): Promise<{ cached: number; total: number }> {
  const path = await getCachedPath(pathId);
  if (!path) return { cached: 0, total: 0 };

  const allWordIds = path.scenes.flatMap((s) => s.word_ids);
  const cachedIds = await getAllCachedWordIds();
  const cachedSet = new Set(cachedIds);

  return {
    cached: allWordIds.filter((id) => cachedSet.has(id)).length,
    total: allWordIds.length,
  };
}

export async function autoCacheWord(wordId: string): Promise<void> {
  try {
    const res = await fetch(`/api/words/${wordId}`);
    if (!res.ok) return;

    const json: ApiResponse<Record<string, unknown>> = await res.json();
    if (!json.data) return;

    const word = json.data as unknown as CachedWord;
    word.cached_at = new Date();
    await cacheWord(word);

    // Cache mnemonic if available
    if (word.id) {
      const mRes = await fetch(`/api/mnemonics?wordId=${wordId}`);
      if (mRes.ok) {
        const mJson: ApiResponse<Record<string, unknown>[]> = await mRes.json();
        if (mJson.data && mJson.data.length > 0) {
          const mnemonic = mJson.data[0] as unknown as CachedMnemonic;
          mnemonic.image_blob = null;
          mnemonic.cached_at = new Date();

          // Fetch image blob if URL exists
          if (mnemonic.image_url) {
            try {
              const imgRes = await fetch(mnemonic.image_url);
              if (imgRes.ok) {
                mnemonic.image_blob = await imgRes.blob();
              }
            } catch {
              // Image fetch failed, continue without
            }
          }

          await cacheMnemonic(mnemonic);
        }
      }
    }

    // Cache audio if available
    const audioWord = word as unknown as { pronunciation_audio_url?: string };
    if (audioWord.pronunciation_audio_url) {
      try {
        const audioRes = await fetch(audioWord.pronunciation_audio_url);
        if (audioRes.ok) {
          const blob = await audioRes.blob();
          const cachedAudio: CachedAudio = {
            word_id: wordId,
            blob,
            cached_at: new Date(),
          };
          await cacheAudio(cachedAudio);
        }
      } catch {
        // Audio fetch failed, continue without
      }
    }
  } catch {
    // Word caching failed silently
  }
}

export async function prefetchSceneWords(
  sceneId: string,
  currentIndex: number,
  count = 5
): Promise<void> {
  try {
    const res = await fetch(`/api/scenes/${sceneId}/words`);
    if (!res.ok) return;

    const json: ApiResponse<{ word_id: string }[]> = await res.json();
    if (!json.data) return;

    const upcoming = json.data.slice(currentIndex, currentIndex + count);
    await Promise.all(upcoming.map((w) => autoCacheWord(w.word_id)));
  } catch {
    // Prefetch failed silently
  }
}
