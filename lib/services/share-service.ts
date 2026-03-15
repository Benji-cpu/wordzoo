import {
  getMnemonicForShare,
  recordShareEvent,
  recordReferralClick,
} from '@/lib/db/community-queries';
import type { MnemonicShareData } from '@/lib/db/community-queries';

export async function getShareData(mnemonicId: string): Promise<MnemonicShareData | null> {
  return getMnemonicForShare(mnemonicId);
}

export async function trackShare(data: {
  userId: string | null;
  mnemonicId: string;
  wordId: string;
  platform?: string;
  format?: 'square' | 'story';
}): Promise<void> {
  await recordShareEvent(data);
}

export async function trackReferralClick(
  referrerId: string,
  clickIp: string | null
): Promise<void> {
  await recordReferralClick(referrerId, clickIp);
}

export function buildShareUrl(wordId: string, userId?: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://wordzoo.app';
  const url = `${base}/word/${wordId}`;
  if (userId) {
    return `${url}?ref=${userId}`;
  }
  return url;
}

export function buildShareText(
  wordText: string,
  meaningEn: string,
  languageName: string
): string {
  return `I learned "${wordText}" in ${languageName} — it means "${meaningEn}"! Try this memory trick on WordZoo.`;
}
