import { sql } from '@/lib/db/client';
import { getUserProfile } from '@/lib/db/queries';

export interface UserDataExport {
  exportedAt: string;
  profile: Awaited<ReturnType<typeof getUserProfile>>;
  subscriptions: unknown[];
  purchases: unknown[];
  studioPathPurchases: unknown[];
  paths: unknown[];
  userPaths: unknown[];
  userWords: unknown[];
  userPhrases: unknown[];
  mnemonicFeedback: unknown[];
  appFeedback: unknown[];
  dailyUsage: unknown[];
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const profile = await getUserProfile(userId);

  const [
    subscriptions,
    purchases,
    studioPathPurchases,
    paths,
    userPaths,
    userWords,
    userPhrases,
    mnemonicFeedback,
    appFeedback,
    dailyUsage,
  ] = await Promise.all([
    sql`SELECT * FROM subscriptions WHERE user_id = ${userId}`,
    sql`SELECT * FROM purchases WHERE user_id = ${userId}`,
    sql`SELECT * FROM studio_path_purchases WHERE user_id = ${userId}`,
    sql`SELECT id, title, description, type, created_at FROM paths WHERE user_id = ${userId}`,
    sql`SELECT * FROM user_paths WHERE user_id = ${userId}`,
    sql`SELECT word_id, status, ease_factor, interval_days, next_review_at, times_reviewed, times_correct, last_reviewed_at, direction FROM user_words WHERE user_id = ${userId}`,
    sql`SELECT phrase_id, status, ease_factor, interval_days, next_review_at, times_reviewed, times_correct, last_reviewed_at FROM user_phrases WHERE user_id = ${userId}`,
    sql`SELECT mnemonic_id, rating, comment, created_at FROM mnemonic_feedback WHERE user_id = ${userId}`,
    sql`SELECT message, page_url, status, created_at FROM app_feedback WHERE user_id = ${userId}`,
    sql`SELECT date, words_learned, tutor_messages, hands_free_seconds, regenerations FROM daily_usage WHERE user_id = ${userId} ORDER BY date DESC LIMIT 365`,
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile,
    subscriptions,
    purchases,
    studioPathPurchases,
    paths,
    userPaths,
    userWords,
    userPhrases,
    mnemonicFeedback,
    appFeedback,
    dailyUsage,
  };
}
