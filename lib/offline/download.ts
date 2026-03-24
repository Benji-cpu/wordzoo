import {
  cacheWord,
  cacheMnemonic,
  cacheAudio,
  cachePath,
  getCachedWord,
  getCachedMnemonic,
  getCachedAudio,
  getCachedPath,
} from './storage';
import type {
  DownloadProgress,
  CachedWord,
  CachedMnemonic,
  CachedAudio,
  CachedPath,
  CachedScene,
} from '@/types/offline';
import type { ApiResponse } from '@/types/api';

interface PathData {
  id: string;
  language_id: string;
  user_id: string | null;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
  scenes: Array<{
    id: string;
    path_id: string;
    title: string;
    description: string | null;
    combined_scene_image_url: string | null;
    sort_order: number;
    created_at: string;
    words: Array<{
      id: string;
      language_id: string;
      text: string;
      romanization: string | null;
      pronunciation_audio_url: string | null;
      meaning_en: string;
      part_of_speech: string;
      frequency_rank: number;
      created_at: string;
      mnemonic?: {
        id: string;
        word_id: string;
        user_id: string | null;
        keyword_text: string;
        scene_description: string;
        image_url: string | null;
        audio_url: string | null;
        is_custom: boolean;
        upvote_count: number;
        thumbs_up_count: number;
        thumbs_down_count: number;
        created_at: string;
      };
    }>;
  }>;
}

export async function* downloadPack(
  pathId: string,
  signal?: AbortSignal
): AsyncGenerator<DownloadProgress> {
  // Phase 1: Fetch path data + mnemonics
  yield { phase: 'mnemonics', current: 0, total: 1, sizeBytes: 0 };

  if (signal?.aborted) return;

  const res = await fetch(`/api/paths/${pathId}/full`);
  if (!res.ok) {
    yield { phase: 'mnemonics', current: 0, total: 1, sizeBytes: 0, error: `Failed to fetch path: ${res.status}` };
    return;
  }

  const json: ApiResponse<PathData> = await res.json();
  if (!json.data) {
    yield { phase: 'mnemonics', current: 0, total: 1, sizeBytes: 0, error: 'No path data returned' };
    return;
  }

  const pathData = json.data;
  let totalBytes = 0;

  // Collect all words from all scenes
  const allWords = pathData.scenes.flatMap((s) => s.words);
  const totalWords = allWords.length;

  // Cache words and mnemonics
  for (let i = 0; i < allWords.length; i++) {
    if (signal?.aborted) return;

    const word = allWords[i];

    // Skip already cached words
    const existingWord = await getCachedWord(word.id);
    if (!existingWord) {
      const cachedWord: CachedWord = {
        ...word,
        created_at: new Date(word.created_at),
        cached_at: new Date(),
      };
      await cacheWord(cachedWord);
      totalBytes += new Blob([JSON.stringify(cachedWord)]).size;
    }

    // Cache mnemonic
    if (word.mnemonic) {
      const existingMnemonic = await getCachedMnemonic(word.mnemonic.id);
      if (!existingMnemonic) {
        const m = word.mnemonic as Record<string, unknown>;
        const cachedMnemonic: CachedMnemonic = {
          ...word.mnemonic,
          bridge_sentence: (m.bridge_sentence as string) ?? null,
          image_reviewed: (m.image_reviewed as boolean) ?? false,
          created_at: new Date(word.mnemonic.created_at),
          image_blob: null,
          cached_at: new Date(),
        };
        await cacheMnemonic(cachedMnemonic);
        totalBytes += new Blob([JSON.stringify(word.mnemonic)]).size;
      }
    }

    yield {
      phase: 'mnemonics',
      current: i + 1,
      total: totalWords,
      sizeBytes: totalBytes,
      wordId: word.id,
    };
  }

  // Phase 2: Download image blobs
  const mnemonicsWithImages = allWords.filter((w) => w.mnemonic?.image_url);

  for (let i = 0; i < mnemonicsWithImages.length; i++) {
    if (signal?.aborted) return;

    const word = mnemonicsWithImages[i];
    const mnemonic = word.mnemonic!;

    // Skip if already cached with blob
    const existing = await getCachedMnemonic(mnemonic.id);
    if (existing?.image_blob) {
      yield {
        phase: 'images',
        current: i + 1,
        total: mnemonicsWithImages.length,
        sizeBytes: totalBytes,
        wordId: word.id,
      };
      continue;
    }

    try {
      const imgRes = await fetch(mnemonic.image_url!);
      if (imgRes.ok) {
        const blob = await imgRes.blob();
        totalBytes += blob.size;

        if (existing) {
          existing.image_blob = blob;
          await cacheMnemonic(existing);
        }
      }
    } catch {
      // Image download failed, continue
    }

    yield {
      phase: 'images',
      current: i + 1,
      total: mnemonicsWithImages.length,
      sizeBytes: totalBytes,
      wordId: word.id,
    };
  }

  // Phase 3: Download audio blobs
  const wordsWithAudio = allWords.filter((w) => w.pronunciation_audio_url);

  for (let i = 0; i < wordsWithAudio.length; i++) {
    if (signal?.aborted) return;

    const word = wordsWithAudio[i];

    // Skip if already cached
    const existing = await getCachedAudio(word.id);
    if (existing) {
      yield {
        phase: 'audio',
        current: i + 1,
        total: wordsWithAudio.length,
        sizeBytes: totalBytes,
        wordId: word.id,
      };
      continue;
    }

    try {
      const audioRes = await fetch(word.pronunciation_audio_url!);
      if (audioRes.ok) {
        const blob = await audioRes.blob();
        totalBytes += blob.size;

        const cachedAudio: CachedAudio = {
          word_id: word.id,
          blob,
          cached_at: new Date(),
        };
        await cacheAudio(cachedAudio);
      }
    } catch {
      // Audio download failed, continue
    }

    yield {
      phase: 'audio',
      current: i + 1,
      total: wordsWithAudio.length,
      sizeBytes: totalBytes,
      wordId: word.id,
    };
  }

  // Phase 4: Mark complete — cache path metadata
  const cachedScenes: CachedScene[] = pathData.scenes.map((s) => ({
    id: s.id,
    path_id: s.path_id,
    title: s.title,
    description: s.description,
    combined_scene_image_url: s.combined_scene_image_url,
    scene_type: (s as { scene_type?: string }).scene_type as 'legacy' | 'dialogue' ?? 'legacy',
    scene_context: (s as { scene_context?: string }).scene_context ?? null,
    sort_order: s.sort_order,
    created_at: new Date(s.created_at),
    word_ids: s.words.map((w) => w.id),
  }));

  const existingCached = await getCachedPath(pathId);
  const cachedPath: CachedPath = {
    id: pathData.id,
    language_id: pathData.language_id,
    user_id: pathData.user_id,
    type: pathData.type as 'premade' | 'custom' | 'travel',
    title: pathData.title,
    description: pathData.description,
    created_at: new Date(pathData.created_at),
    scenes: cachedScenes,
    is_fully_offline: true,
    cached_at: existingCached?.cached_at ?? new Date(),
  };

  await cachePath(cachedPath);

  yield {
    phase: 'complete',
    current: totalWords,
    total: totalWords,
    sizeBytes: totalBytes,
  };
}
