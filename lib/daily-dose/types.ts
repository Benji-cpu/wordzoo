/**
 * One Daily Dose card: the same short text at three levels, each with its
 * English. Written ahead into the repo (see lib/daily-dose/index.ts), so the
 * dashboard reads a file instead of a table a nightly Gemini cron had to fill.
 *
 * Each `*_target` must split into the same number of sentences as its
 * `*_english` (split on . ! ? followed by whitespace) — InfoByteCard
 * interleaves them line by line. `daily-dose.test.ts` enforces it.
 */
export interface DailyDoseEntry {
  /** Publish date, YYYY-MM-DD (UTC). */
  date: string;
  /** Badge text in snake_case, e.g. `small_talk`. */
  category: string;
  /** One English sentence: what today's card is about. */
  topic_summary: string;
  easy_target: string;
  easy_english: string;
  medium_target: string;
  medium_english: string;
  hard_target: string;
  hard_english: string;
}
