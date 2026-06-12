import { sql } from '@/lib/db/client';

/** Recipient row shared by the reminder queries. */
export interface ReminderRecipient {
  id: string;
  email: string;
  name: string | null;
  unsubscribe_token: string;
  current_streak: number;
  due_count: number;
}

/**
 * Users with an active streak who haven't practiced yet today — the
 * streak-at-risk nudge audience. Due count rides along for the email copy.
 */
export async function getStreakAtRiskUsers(): Promise<ReminderRecipient[]> {
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.unsubscribe_token,
      us.current_streak,
      (SELECT COUNT(*)::int FROM user_words uw
        WHERE uw.user_id = u.id AND uw.next_review_at <= NOW() AND uw.status != 'new') AS due_count
    FROM user_streaks us
    JOIN users u ON u.id = us.user_id
    WHERE us.current_streak > 0
      AND us.last_active_date = CURRENT_DATE - 1
      AND u.email_reminders_enabled
      AND u.email NOT LIKE '%@wordzoo.dev'
  `;
  return rows as ReminderRecipient[];
}

/**
 * Users (without a streak at risk) sitting on a meaningful review queue.
 */
export async function getUsersWithDueReviews(minDue = 5): Promise<ReminderRecipient[]> {
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.unsubscribe_token,
      COALESCE(us.current_streak, 0) AS current_streak,
      due.due_count
    FROM users u
    JOIN LATERAL (
      SELECT COUNT(*)::int AS due_count FROM user_words uw
      WHERE uw.user_id = u.id AND uw.next_review_at <= NOW() AND uw.status != 'new'
    ) due ON TRUE
    LEFT JOIN user_streaks us ON us.user_id = u.id
    WHERE u.email_reminders_enabled
      AND u.email NOT LIKE '%@wordzoo.dev'
      AND due.due_count >= ${minDue}
  `;
  return rows as ReminderRecipient[];
}

export interface WeeklyRecapRecipient {
  id: string;
  email: string;
  name: string | null;
  unsubscribe_token: string;
  current_streak: number;
  words_learned: number;
  reviews_done: number;
  xp_gained: number;
}

/**
 * Weekly recap audience: emailable users active in the last 14 days, with
 * their last-7-day stats aggregated inline.
 */
export async function getWeeklyRecapRecipients(): Promise<WeeklyRecapRecipient[]> {
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.unsubscribe_token,
      COALESCE(us.current_streak, 0) AS current_streak,
      COALESCE((SELECT SUM(du.words_learned)::int FROM daily_usage du
        WHERE du.user_id = u.id AND du.date >= CURRENT_DATE - 7), 0) AS words_learned,
      COALESCE((SELECT COUNT(*)::int FROM user_words uw
        WHERE uw.user_id = u.id AND uw.last_reviewed_at >= NOW() - INTERVAL '7 days'), 0) AS reviews_done,
      COALESCE((SELECT SUM(x.amount)::int FROM user_xp_events x
        WHERE x.user_id = u.id AND x.created_at >= NOW() - INTERVAL '7 days'), 0) AS xp_gained
    FROM users u
    LEFT JOIN user_streaks us ON us.user_id = u.id
    WHERE u.email_reminders_enabled
      AND u.email NOT LIKE '%@wordzoo.dev'
      AND EXISTS (
        SELECT 1 FROM user_xp_events x
        WHERE x.user_id = u.id AND x.created_at >= NOW() - INTERVAL '14 days'
      )
  `;
  return rows as WeeklyRecapRecipient[];
}

export async function getUserByUnsubscribeToken(
  token: string
): Promise<{ id: string; email: string } | null> {
  const rows = await sql`
    SELECT id, email FROM users WHERE unsubscribe_token = ${token}
  `;
  return (rows[0] as { id: string; email: string }) ?? null;
}

export async function setEmailRemindersEnabled(
  userId: string,
  enabled: boolean
): Promise<void> {
  await sql`UPDATE users SET email_reminders_enabled = ${enabled} WHERE id = ${userId}`;
}

export async function getEmailRemindersEnabled(userId: string): Promise<boolean> {
  const rows = await sql`SELECT email_reminders_enabled FROM users WHERE id = ${userId}`;
  return Boolean(rows[0]?.email_reminders_enabled);
}
