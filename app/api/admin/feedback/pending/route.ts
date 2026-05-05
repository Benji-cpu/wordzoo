/**
 * GET /api/admin/feedback/pending
 *   Lists status='new' app_feedback rows joined with user email + role.
 *   Used by the daily-feedback-triage remote agent.
 *
 * POST /api/admin/feedback/pending
 *   Body: { ids: string[] }. Marks listed ids as status='reviewed' with an
 *   admin_notes line attributing the change to the agent.
 *
 * Both gated by `Authorization: Bearer ${CRON_SECRET}`. Returns 401 without it.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function checkCronSecret(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!checkCronSecret(request)) return unauthorized();

  const rows = await sql`
    SELECT af.id, af.user_id, af.message, af.page_url, af.page_title,
      af.viewport_width, af.viewport_height, af.user_agent,
      af.activity_trail, af.status, af.created_at,
      u.email AS user_email, u.name AS user_name
    FROM app_feedback af
    JOIN users u ON u.id = af.user_id
    WHERE af.status = 'new'
    ORDER BY af.created_at DESC
  `;

  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  if (!checkCronSecret(request)) return unauthorized();

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ids = body.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'ids must be string[]' }, { status: 400 });
  }
  if (ids.length === 0) {
    return NextResponse.json({ data: { updated: 0 } });
  }

  const note = `Marked reviewed by daily-feedback-triage agent on ${new Date().toISOString().slice(0, 10)}`;
  const updated = await sql`
    UPDATE app_feedback
    SET status = 'reviewed',
        admin_notes = COALESCE(admin_notes || E'\n', '') || ${note}
    WHERE id = ANY(${ids as string[]}::uuid[])
      AND status = 'new'
    RETURNING id
  `;

  return NextResponse.json({ data: { updated: updated.length } });
}
