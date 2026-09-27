import { sql } from '@/lib/db/client';
import { REVIEW_SITTING } from '@/lib/srs/engine';

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
 * Everyone emailable, with the reminder facts computed once.
 *
 * `due_count` is the next /review sitting in the learner's ACTIVE language —
 * the same number the dashboard leads with — not every overdue row in every
 * language they ever touched. The old count told a learner back from a break
 * that 141 words were waiting, 95 of them in languages he had abandoned.
 */
async function reminderCandidates(): Promise<
  (ReminderRecipient & { streak_at_risk: boolean; recently_active: boolean })[]
> {
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.unsubscribe_token,
      COALESCE(us.current_streak, 0) AS current_streak,
      (COALESCE(us.current_streak, 0) > 0 AND us.last_active_date = CURRENT_DATE - 1) AS streak_at_risk,
      -- Stop nudging someone who has been gone three months: they left.
      COALESCE(us.last_active_date >= CURRENT_DATE - 90, false) AS recently_active,
      (
        LEAST(${REVIEW_SITTING.words}, (
          SELECT COUNT(*) FROM user_words uw JOIN words w ON w.id = uw.word_id
          WHERE uw.user_id = u.id AND uw.next_review_at <= NOW() AND uw.status != 'new'
            AND w.language_id = ap.language_id))
        + LEAST(${REVIEW_SITTING.phrases}, (
          SELECT COUNT(*) FROM user_phrases uph
          JOIN scene_phrases sp ON sp.id = uph.phrase_id
          JOIN scenes s ON s.id = sp.scene_id
          JOIN paths p ON p.id = s.path_id
          WHERE uph.user_id = u.id AND uph.next_review_at <= NOW() AND uph.status != 'new'
            AND p.language_id = ap.language_id))
      )::int AS due_count
    FROM users u
    JOIN LATERAL (
      SELECT p.language_id FROM user_paths up JOIN paths p ON p.id = up.path_id
      WHERE up.user_id = u.id AND up.status = 'active'
      ORDER BY up.started_at DESC LIMIT 1
    ) ap ON TRUE
    LEFT JOIN user_streaks us ON us.user_id = u.id
    WHERE u.email_reminders_enabled
      AND u.email NOT LIKE '%@wordzoo.dev'
  `;
  return rows as (ReminderRecipient & { streak_at_risk: boolean; recently_active: boolean })[];
}

/**
 * Users with an active streak who haven't practiced yet today — the
 * streak-at-risk nudge audience. Due count rides along for the email copy.
 */
export async function getStreakAtRiskUsers(): Promise<ReminderRecipient[]> {
  return (await reminderCandidates()).filter((u) => u.streak_at_risk);
}

/**
 * Users (without a streak at risk) sitting on a meaningful review queue.
 */
export async function getUsersWithDueReviews(minDue = 5): Promise<ReminderRecipient[]> {
  return (await reminderCandidates()).filter((u) => u.recently_active && u.due_count >= minDue);
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
