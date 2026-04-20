import { sql } from './client';

export interface InsightState {
  seenIds: Set<string>;
  shownToday: number;
}

/** Get combined insight state in one round-trip */
export async function getInsightState(userId: string): Promise<InsightState> {
  const rows = await sql`
    SELECT
      insight_id,
      (session_date = CURRENT_DATE) AS is_today
    FROM user_insights
    WHERE user_id = ${userId}
  `;

  const seenIds = new Set<string>();
  let shownToday = 0;

  for (const row of rows) {
    const r = row as { insight_id: string; is_today: boolean };
    seenIds.add(r.insight_id);
    if (r.is_today) {
      shownToday++;
    }
  }

  return { seenIds, shownToday };
}

/** Mark an insight as shown (first display) */
export async function markInsightShown(
  userId: string,
  insightId: string
): Promise<void> {
  await sql`
    INSERT INTO user_insights (user_id, insight_id)
    VALUES (${userId}, ${insightId})
    ON CONFLICT (user_id, insight_id) DO NOTHING
  `;
}

/** Mark an insight as dismissed (user tapped "Got it") */
export async function markInsightDismissed(
  userId: string,
  insightId: string
): Promise<void> {
  await sql`
    UPDATE user_insights
    SET dismissed_at = NOW()
    WHERE user_id = ${userId} AND insight_id = ${insightId}
  `;
}
