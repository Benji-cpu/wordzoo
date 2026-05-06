/**
 * GET /api/cron/nightly-routine
 *
 * Hit by Vercel Cron at 19:27 UTC (≈03:27 Bali). Does ALL data-gathering for
 * the daily feedback triage, writes digests/YYYY-MM-DD.json into
 * Benji-cpu/wordzoo via the GitHub Contents API, and marks the bundled
 * pending rows as status='reviewed' so they don't recur tomorrow.
 *
 * The Claude Code remote trigger fires 5 min later (19:32 UTC) and reads the
 * JSON file from the cloned repo — it does NOT call this route. The trigger
 * sandbox proxy blocks every host except github.com (custom domains too), so
 * git is the only viable bus between Vercel and the agent. See CLAUDE.md
 * "Trigger Maintenance" for context.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Required env: CRON_SECRET, GITHUB_PAT_REPO_WRITE (fine-grained PAT, scoped
 *               to Benji-cpu/wordzoo with Contents: write).
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

const REPO_OWNER = 'Benji-cpu';
const REPO_NAME = 'wordzoo';
const COMMITTER = { name: 'Benji-cpu', email: 'b.hemsonstruthers@gmail.com' };

type PendingRow = {
  id: string;
  user_id: string;
  message: string;
  page_url: string | null;
  page_title: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  user_agent: string | null;
  activity_trail: unknown;
  status: string;
  created_at: string;
  user_email: string;
  user_name: string | null;
};

function todayBali(): string {
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function writeDigestToRepo(
  today: string,
  payload: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.GITHUB_PAT_REPO_WRITE;
  if (!token) return { ok: false, error: 'GITHUB_PAT_REPO_WRITE missing' };

  const path = `digests/${today}.json`;
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  let sha: string | undefined;
  const head = await fetch(`${url}?ref=main`, { headers });
  if (head.status === 200) {
    const data = (await head.json()) as { sha: string };
    sha = data.sha;
  } else if (head.status !== 404) {
    return { ok: false, error: `github GET ${head.status}` };
  }

  const body = {
    message: `digest: ${today}`,
    content: Buffer.from(JSON.stringify(payload, null, 2)).toString('base64'),
    branch: 'main',
    committer: COMMITTER,
    ...(sha ? { sha } : {}),
  };

  const put = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!put.ok) {
    const text = await put.text();
    return { ok: false, error: `github PUT ${put.status}: ${text.slice(0, 200)}` };
  }
  return { ok: true };
}

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
      WHERE next_review_at < now() - interval '2 days'
    `) as Array<{ count: number }>;
    return rows[0]?.count ?? 0;
  });

  const pendingRows = await safe('pendingRows', async () => {
    return (await sql`
      SELECT af.id, af.user_id, af.message, af.page_url, af.page_title,
        af.viewport_width, af.viewport_height, af.user_agent,
        af.activity_trail, af.status, af.created_at,
        u.email AS user_email, u.name AS user_name
      FROM app_feedback af
      JOIN users u ON u.id = af.user_id
      WHERE af.status = 'new'
      ORDER BY af.created_at DESC
    `) as PendingRow[];
  });

  const today = todayBali();
  const payload = {
    project: 'wordzoo',
    today,
    startedAt,
    finishedAt: new Date().toISOString(),
    feedback: {
      byStatus: feedbackByStatus ?? {},
      newLast24h: newFeedbackLast24h ?? 0,
      pendingRows: pendingRows ?? [],
    },
    health: {
      stuckMnemonicsLast72h: stuckMnemonicsLast72h ?? 0,
      overdueReviews: overdueReviews ?? 0,
    },
    errors,
  };

  const write = await writeDigestToRepo(today, payload);
  if (!write.ok) errors.push(`digestWrite: ${write.error}`);

  if (pendingRows && pendingRows.length > 0 && write.ok) {
    await safe('markReviewed', async () => {
      const ids = pendingRows.map((r) => r.id);
      const note = `Bundled into digests/${today}.json`;
      await sql`
        UPDATE app_feedback
        SET status = 'reviewed',
            admin_notes = COALESCE(admin_notes || E'\n', '') || ${note}
        WHERE id = ANY(${ids}::uuid[]) AND status = 'new'
      `;
    });
  }

  return NextResponse.json({ ...payload, digestWritten: write.ok });
}
