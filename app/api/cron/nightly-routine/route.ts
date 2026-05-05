/**
 * GET /api/cron/nightly-routine
 *
 * Nightly cross-project digest. Hit by GitHub Actions at 19:32 UTC daily
 * (≈03:32 Bali). Staggered +5min from Programme's 03:27 so digests arrive
 * separately. Currently surfaces the JSON via the workflow step summary —
 * Resend is not yet wired up for WordZoo (see MEMORY.md).
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Query: ?digest=true reserved for future Resend integration
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (err) {
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  const feedbackByStatus = await safe('feedbackByStatus', async () => {
    const rows = (await sql`
      SELECT status, COUNT(*)::int AS count
      FROM app_feedback
      GROUP BY status
    `) as Array<{ status: string; count: number }>;
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r.count;
      return acc;
    }, {});
  });

  const newFeedbackLast24h = await safe('newFeedbackLast24h', async () => {
    const rows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM app_feedback
      WHERE status = 'new' AND created_at >= now() - interval '24 hours'
    `) as Array<{ count: number }>;
    return rows[0]?.count ?? 0;
  });

  const stuckMnemonicsLast72h = await safe('stuckMnemonicsLast72h', async () => {
    const rows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM mnemonics
      WHERE audio_url IS NULL AND created_at < now() - interval '72 hours'
    `) as Array<{ count: number }>;
    return rows[0]?.count ?? 0;
  });

  const overdueReviews = await safe('overdueReviews', async () => {
    const rows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM user_words
      WHERE next_review_date IS NOT NULL
        AND next_review_date < now() - interval '2 days'
    `) as Array<{ count: number }>;
    return rows[0]?.count ?? 0;
  });

  const payload = {
    project: 'wordzoo',
    startedAt,
    finishedAt: new Date().toISOString(),
    feedback: {
      byStatus: feedbackByStatus ?? {},
      newLast24h: newFeedbackLast24h ?? 0,
    },
    health: {
      stuckMnemonicsLast72h: stuckMnemonicsLast72h ?? 0,
      overdueReviews: overdueReviews ?? 0,
    },
    errors,
  };

  return NextResponse.json(payload);
}
