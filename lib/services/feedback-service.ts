import type { MnemonicFeedback } from '@/types/database';
import { upsertMnemonicFeedback, getUserFeedbackForMnemonic } from '@/lib/db/queries';

export async function submitMnemonicFeedback(
  userId: string,
  mnemonicId: string,
  rating: 'thumbs_up' | 'thumbs_down',
  comment?: string
): Promise<MnemonicFeedback> {
  return upsertMnemonicFeedback(userId, mnemonicId, rating, comment);
}

export async function getUserFeedback(
  userId: string,
  mnemonicId: string
): Promise<MnemonicFeedback | null> {
  return getUserFeedbackForMnemonic(userId, mnemonicId);
}
