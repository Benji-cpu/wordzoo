/**
 * Daily Dose, written ahead.
 *
 * Until 2026-09-29 a nightly Vercel cron asked Gemini for a new card in every
 * language and stored it in `info_bytes`. WordZoo has one learner with a fixed
 * goal (São Paulo, 20 Dec), so the cards are now written into this folder
 * once, reviewed in git, and read straight from the bundle: no model, no
 * quota, no DB write, nothing that fails at 01:00.
 *
 * Only languages with a written file have a card. The `info_bytes` table and
 * its old rows stay in the DB, unread.
 */
import type { DailyDoseEntry } from '@/lib/daily-dose/types';
import { PT_DAILY_DOSE } from '@/lib/daily-dose/pt';

const BY_LANGUAGE: Record<string, readonly DailyDoseEntry[]> = {
  pt: PT_DAILY_DOSE,
};

const DAY_MS = 86_400_000;

/**
 * Today's card for a language (UTC date), or null when none is written.
 *
 * Outside the written range it never goes blank: before the first date it
 * shows the first card, and after the last it cycles through the set by day,
 * so the card keeps changing rather than freezing on one.
 */
export function getDailyDose(
  languageCode: string | null | undefined,
  now: Date = new Date(),
): DailyDoseEntry | null {
  const entries = languageCode ? BY_LANGUAGE[languageCode] : undefined;
  if (!entries || entries.length === 0) return null;

  const today = now.toISOString().slice(0, 10);
  const exact = entries.find((e) => e.date === today);
  if (exact) return exact;
  if (today < entries[0].date) return entries[0];

  const dayNumber = Math.floor(Date.parse(today) / DAY_MS);
  return entries[dayNumber % entries.length];
}
