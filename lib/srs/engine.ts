import type { UserWord } from '@/types/database';

export async function getDueWords(
  _userId: string,
  _limit?: number,
  _context?: string
): Promise<UserWord[]> {
  throw new Error('Not implemented');
}

export async function recordReview(
  _userId: string,
  _wordId: string,
  _direction: 'recognition' | 'production',
  _rating: 'instant' | 'got_it' | 'hard' | 'forgot'
): Promise<{ nextReviewAt: Date; newInterval: number }> {
  throw new Error('Not implemented');
}
