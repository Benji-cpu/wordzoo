import { sql } from '@/lib/db/client';
import type { AppFeedback } from '@/types/database';
import type { SubmitAppFeedbackInput } from '@/types/api';

export async function insertAppFeedback(
  userId: string,
  input: SubmitAppFeedbackInput
): Promise<AppFeedback> {
  const rows = await sql`
    INSERT INTO app_feedback (
      user_id, message, page_url, page_title, route_params,
      screenshot_url, viewport_width, viewport_height, user_agent,
      activity_trail
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
      ${input.activityTrail ? JSON.stringify(input.activityTrail) : null}
    )
    RETURNING *
  `;
  return rows[0] as AppFeedback;
}
