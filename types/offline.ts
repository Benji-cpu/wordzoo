import type { Word, Mnemonic, UserWord, Path, Scene } from './database';

// --- IndexedDB cached records ---

export interface CachedWord extends Word {
  cached_at: Date;
}

export interface CachedMnemonic extends Mnemonic {
  image_blob: Blob | null;
  cached_at: Date;
}

export interface CachedAudio {
  word_id: string;
  blob: Blob;
  cached_at: Date;
}

export interface CachedUserWord extends UserWord {
  cached_at: Date;
}

export interface CachedScene extends Scene {
  word_ids: string[];
}

export interface CachedPath extends Path {
  scenes: CachedScene[];
  is_fully_offline: boolean;
  cached_at: Date;
}

// --- Sync ---

export interface SyncEvent {
  id: string;
  user_id: string;
  word_id: string;
  direction: 'recognition' | 'production';
  rating: 'instant' | 'got_it' | 'hard' | 'forgot';
  reviewed_at: string;
  created_at: string;
}

export interface SyncResult {
  synced: number;
  skipped: number;
  failed: number;
  errors: string[];
  updated_user_words: UserWord[];
}

// --- Download ---

export type DownloadPhase = 'mnemonics' | 'images' | 'audio' | 'complete';

export interface DownloadProgress {
  phase: DownloadPhase;
  current: number;
  total: number;
  sizeBytes: number;
  wordId?: string;
  error?: string;
}

export type PackDownloadStatus = 'idle' | 'downloading' | 'paused' | 'complete' | 'error';

// --- Cache ---

export interface CacheStats {
  totalBytes: number;
  breakdown: {
    images: number;
    audio: number;
    data: number;
  };
  cachedWords: number;
  lastSync: Date | null;
}

export interface CacheCleanResult {
  deletedWords: number;
  deletedMnemonics: number;
  deletedAudio: number;
  freedBytes: number;
}

// --- Status ---

export interface OfflineStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncAt: Date | null;
}
