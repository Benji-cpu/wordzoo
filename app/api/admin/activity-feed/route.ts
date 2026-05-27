/**
 * GET /api/admin/activity-feed
 *
 * Cross-app activity feed for the Freelance ops hub.
 * Returns recent feedback + signups for aggregation in /admin/apps.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Query: ?since=<iso>&limit=20
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  const expected = process.env.CRON_SECRET;
  if (!expected || (authHeader !== `Bearer ${expected}` && querySecret !== expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
  const sinceParam = url.searchParams.get('since');
  const since = sinceParam
    ? new Date(sinceParam).toISOString()
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const feedbackRows = await sql`
    SELECT f.id, f.message, f.status, f.page_url, f.created_at,
           u.email AS user_email, u.name AS user_name
    FROM app_feedback f
    LEFT JOIN users u ON u.id = f.user_id
    WHERE f.created_at >= ${since}
    ORDER BY f.created_at DESC
    LIMIT ${limit}
  `;

  const signupRows = await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE created_at >= ${since}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  const feedbackStats = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'new')::int AS new_count
    FROM app_feedback
  `;

  const userStats = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE created_at >= ${dayAgo})::int AS last_24h
    FROM users
  `;

  return NextResponse.json({
    app: 'wordzoo',
    feedback: feedbackRows.map((f) => ({
      id: f.id,
      message: f.message,
      status: f.status,
      page_url: f.page_url,
      user_email: f.user_email,
      user_name: f.user_name,
      created_at: f.created_at,
    })),
    signups: signupRows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      created_at: u.created_at,
    })),
    counts: {
      feedback_total: feedbackStats[0]?.total ?? 0,
      feedback_new: feedbackStats[0]?.new_count ?? 0,
      signups_total: userStats[0]?.total ?? 0,
      signups_24h: userStats[0]?.last_24h ?? 0,
    },
  });
}
