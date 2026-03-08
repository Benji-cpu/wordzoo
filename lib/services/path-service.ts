import type { Path, Scene } from '@/types/database';

export async function getActivePath(_userId: string): Promise<Path | null> {
  throw new Error('Not implemented');
}

export async function getNextScene(
  _userId: string,
  _pathId: string
): Promise<Scene | null> {
  throw new Error('Not implemented');
}

export async function getPathProgress(
  _userId: string,
  _pathId: string
): Promise<{ completed: number; total: number; percentMastered: number }> {
  throw new Error('Not implemented');
}
