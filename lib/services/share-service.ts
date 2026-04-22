import { getMnemonicForShare, recordReferralClick } from '@/lib/db/public-queries';
import type { MnemonicShareData } from '@/lib/db/public-queries';

export async function getShareData(mnemonicId: string): Promise<MnemonicShareData | null> {
  return getMnemonicForShare(mnemonicId);
}

export async function trackReferralClick(
  referrerId: string,
  clickIp: string | null,
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
  languageName: string,
): string {
  return `I learned "${wordText}" in ${languageName} — it means "${meaningEn}"! Try this memory trick on WordZoo.`;
}
