import { sql } from '@/lib/db/client';
import type { AppFeedback } from '@/types/database';
import type { SubmitAppFeedbackInput } from '@/types/api';

const RATE_LIMIT_PER_HOUR = 5;

export class FeedbackRateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'FeedbackRateLimitError';
  }
}

function isPowerUser(email: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function insertAppFeedback(
  userId: string,
  input: SubmitAppFeedbackInput
): Promise<AppFeedback> {
  const userRows = await sql`SELECT email FROM users WHERE id = ${userId}`;
  const email = (userRows[0]?.email as string | undefined) ?? null;

  if (!isPowerUser(email)) {
    const recent = await sql`
      SELECT COUNT(*)::int AS count
      FROM app_feedback
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '1 hour'
    `;
    const count = (recent[0]?.count as number | undefined) ?? 0;
    if (count >= RATE_LIMIT_PER_HOUR) {
      throw new FeedbackRateLimitError();
    }
  }

  const rows = await sql`
    INSERT INTO app_feedback (
      user_id, message, page_url, page_title, route_params,
      screenshot_url, viewport_width, viewport_height, user_agent,
      activity_trail, domain_context
    ) VALUES (
      ${userId},
      ${input.message},
      ${input.pageUrl},
      ${input.pageTitle ?? null},
      ${JSON.stringify(input.routeParams ?? {})},
      ${input.screenshotUrl ?? null},
      ${input.viewportWidth ?? null},
      ${input.viewportHeight ?? null},
      ${input.userAgent ?? null},
      ${input.activityTrail ? JSON.stringify(input.activityTrail) : null},
      ${input.domainContext != null ? JSON.stringify(input.domainContext) : null}
    )
    RETURNING *
  `;
  return rows[0] as AppFeedback;
}
