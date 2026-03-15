import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  CachedWord,
  CachedMnemonic,
  CachedAudio,
  CachedUserWord,
  CachedPath,
  SyncEvent,
} from '@/types/offline';

interface WordZooDB extends DBSchema {
  words: {
    key: string;
    value: CachedWord;
    indexes: {
      'by-language': string;
      'by-cached-at': Date;
    };
  };
  mnemonics: {
    key: string;
    value: CachedMnemonic;
    indexes: {
      'by-word': string;
    };
  };
  audio: {
    key: string;
    value: CachedAudio;
  };
  user_words: {
    key: string;
    value: CachedUserWord;
    indexes: {
      'by-word': string;
      'by-next-review': Date;
    };
  };
  review_queue: {
    key: string;
    value: SyncEvent;
    indexes: {
      'by-created-at': string;
    };
  };
  paths: {
    key: string;
    value: CachedPath;
    indexes: {
      'by-language': string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<WordZooDB>> | null = null;

function getDB(): Promise<IDBPDatabase<WordZooDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WordZooDB>('wordzoo-offline', 1, {
      upgrade(db) {
        // Words store
        const wordStore = db.createObjectStore('words', { keyPath: 'id' });
        wordStore.createIndex('by-language', 'language_id');
        wordStore.createIndex('by-cached-at', 'cached_at');

        // Mnemonics store
        const mnemonicStore = db.createObjectStore('mnemonics', { keyPath: 'id' });
        mnemonicStore.createIndex('by-word', 'word_id');

        // Audio store
        db.createObjectStore('audio', { keyPath: 'word_id' });

        // User words store
        const userWordStore = db.createObjectStore('user_words', { keyPath: 'id' });
        userWordStore.createIndex('by-word', 'word_id');
        userWordStore.createIndex('by-next-review', 'next_review_at');

        // Review queue store
        const reviewStore = db.createObjectStore('review_queue', { keyPath: 'id' });
        reviewStore.createIndex('by-created-at', 'created_at');

        // Paths store
        const pathStore = db.createObjectStore('paths', { keyPath: 'id' });
        pathStore.createIndex('by-language', 'language_id');
      },
    });
  }
  return dbPromise;
}

// --- Words ---

export async function cacheWord(word: CachedWord): Promise<void> {
  const db = await getDB();
  await db.put('words', word);
}

export async function getCachedWord(id: string): Promise<CachedWord | undefined> {
  const db = await getDB();
  return db.get('words', id);
}

export async function getAllCachedWordIds(): Promise<string[]> {
  const db = await getDB();
  return db.getAllKeys('words') as Promise<string[]>;
}

export async function isWordCachedOffline(wordId: string): Promise<boolean> {
  const word = await getCachedWord(wordId);
  return !!word;
}

export async function deleteOldWords(olderThan: Date): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('words', 'readwrite');
  const index = tx.store.index('by-cached-at');
  let cursor = await index.openCursor();
  let deleted = 0;

  while (cursor) {
    if (cursor.value.cached_at < olderThan) {
      await cursor.delete();
      deleted++;
    }
    cursor = await cursor.continue();
  }

  await tx.done;
  return deleted;
}

// --- Mnemonics ---

export async function cacheMnemonic(mnemonic: CachedMnemonic): Promise<void> {
  const db = await getDB();
  await db.put('mnemonics', mnemonic);
}

export async function getCachedMnemonic(id: string): Promise<CachedMnemonic | undefined> {
  const db = await getDB();
  return db.get('mnemonics', id);
}

// --- Audio ---

export async function cacheAudio(audio: CachedAudio): Promise<void> {
  const db = await getDB();
  await db.put('audio', audio);
}

export async function getCachedAudio(wordId: string): Promise<CachedAudio | undefined> {
  const db = await getDB();
  return db.get('audio', wordId);
}

// --- User Words ---

export async function cacheUserWord(userWord: CachedUserWord): Promise<void> {
  const db = await getDB();
  await db.put('user_words', userWord);
}

export async function getCachedUserWord(id: string): Promise<CachedUserWord | undefined> {
  const db = await getDB();
  return db.get('user_words', id);
}

export async function getDueUserWords(): Promise<CachedUserWord[]> {
  const db = await getDB();
  const now = new Date();
  const tx = db.transaction('user_words', 'readonly');
  const index = tx.store.index('by-next-review');
  const range = IDBKeyRange.upperBound(now);
  return index.getAll(range);
}

// --- Review Queue (Sync) ---

export async function queueReviewEvent(event: SyncEvent): Promise<void> {
  const db = await getDB();
  await db.put('review_queue', event);
}

export async function getPendingSync(): Promise<SyncEvent[]> {
  const db = await getDB();
  const tx = db.transaction('review_queue', 'readonly');
  const index = tx.store.index('by-created-at');
  return index.getAll();
}

export async function clearPendingSync(): Promise<void> {
  const db = await getDB();
  await db.clear('review_queue');
}

export async function removeSyncEvents(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('review_queue', 'readwrite');
  await Promise.all(ids.map((id) => tx.store.delete(id)));
  await tx.done;
}

// --- Paths ---

export async function cachePath(path: CachedPath): Promise<void> {
  const db = await getDB();
  await db.put('paths', path);
}

export async function getCachedPath(id: string): Promise<CachedPath | undefined> {
  const db = await getDB();
  return db.get('paths', id);
}

export async function getAllCachedPaths(): Promise<CachedPath[]> {
  const db = await getDB();
  return db.getAll('paths');
}

// --- Size estimation ---

type StoreName = 'words' | 'mnemonics' | 'audio' | 'user_words' | 'review_queue' | 'paths';

export async function estimateStoreSize(storeName: StoreName): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readonly');
  const all = await tx.store.getAll();
  // Rough estimate: serialize to JSON and count bytes
  let totalBytes = 0;
  for (const record of all) {
    try {
      // For records with blobs, estimate blob size separately
      const rec = record as unknown as Record<string, unknown>;
      if (rec.blob instanceof Blob) {
        totalBytes += rec.blob.size;
      }
      if (rec.image_blob instanceof Blob) {
        totalBytes += rec.image_blob.size;
      }
      // Add JSON overhead for metadata
      totalBytes += new Blob([JSON.stringify(record)]).size;
    } catch {
      totalBytes += 100; // fallback estimate per record
    }
  }
  return totalBytes;
}
