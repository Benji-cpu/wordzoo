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

// Six Neon round-trips plus two GitHub API calls. On the default (~10s) budget
// this intermittently timed out before writing the digest, which is what
// produced the long run of `triage: missing digest` stubs — the agent found no
// digests/YYYY-MM-DD.json and committed a stub instead. Failures were sporadic
// (a few days succeeded) which is the signature of a timeout, not of an expired
// GITHUB_PAT_REPO_WRITE.
export const maxDuration = 60;

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

  // All six reads are independent — run them concurrently rather than as six
  // sequential Neon round-trips. safe() still isolates each failure.
  const [
    feedbackByStatus,
    newFeedbackLast24h,
    stuckMnemonicsLast72h,
    overdueReviews,
    spendLast24h,
    pedagogy,
    pendingRows,
  ] = await Promise.all([
    safe('feedbackByStatus', async () => {
      const rows = (await sql`
        SELECT status, COUNT(*)::int AS count
        FROM app_feedback
        GROUP BY status
      `) as Array<{ status: string; count: number }>;
      return rows.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = r.count;
        return acc;
      }, {});
    }),

    safe('newFeedbackLast24h', async () => {
      const rows = (await sql`
        SELECT COUNT(*)::int AS count
        FROM app_feedback
        WHERE status = 'new' AND created_at >= now() - interval '24 hours'
      `) as Array<{ count: number }>;
      return rows[0]?.count ?? 0;
    }),

    safe('stuckMnemonicsLast72h', async () => {
      const rows = (await sql`
        SELECT COUNT(*)::int AS count
        FROM mnemonics
        WHERE audio_url IS NULL AND created_at < now() - interval '72 hours'
      `) as Array<{ count: number }>;
      return rows[0]?.count ?? 0;
    }),

    safe('overdueReviews', async () => {
      const rows = (await sql`
        SELECT COUNT(*)::int AS count
        FROM user_words
        WHERE next_review_at < now() - interval '2 days'
      `) as Array<{ count: number }>;
      return rows[0]?.count ?? 0;
    }),

    // Spend rollup: what the AI/image/TTS/Blob endpoints actually cost in the
    // last 24h, per kind. Early warning if a client starts looping a
    // generation endpoint, and the signal to watch after any bulk re-enrich.
    safe('spendLast24h', async () => {
      return (await sql`
        SELECT kind, SUM(units)::int AS units, COUNT(*)::int AS calls
        FROM spend_events
        WHERE created_at > now() - interval '24 hours'
        GROUP BY kind
        ORDER BY units DESC
      `) as Array<{ kind: string; units: number; calls: number }>;
    }),

    // Pedagogy rollup. The admin page at /admin/pedagogy renders these live,
    // but pedagogy_events is pruned at 90 days — committing the summary into
    // digests/*.json is what gives us a permanent, diffable retention history
    // in git without standing up a warehouse.
    safe('pedagogy', async () => {
      const {
        getCueAccuracy,
        getCheckpointStats,
        getRetentionCurve,
        getOverdueQueue,
        getConsolidationFunnel,
        getScheduleHealth,
      } = await import('@/lib/db/pedagogy-queries');
      const [
        cueAccuracy,
        cueAccuracy30,
        checkpoints,
        retention,
        overdue,
        consolidation,
        scheduleHealth,
      ] = await Promise.all([
        getCueAccuracy(1),
        // getCueAccuracy(1) is empty on a quiet day, which reads as "no data"
        // rather than "no activity". The 30-day window is the diffable trend.
        getCueAccuracy(30),
        getCheckpointStats(1),
        getRetentionCurve(30),
        getOverdueQueue(),
        getConsolidationFunnel(),
        getScheduleHealth(),
      ]);
      return {
        cueAccuracy,
        cueAccuracy30,
        checkpoints,
        retention,
        overdue,
        consolidation,
        scheduleHealth,
      };
    }),

    safe('pendingRows', async () => {
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
    }),
  ]);

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
      spendLast24h: spendLast24h ?? [],
      pedagogy: pedagogy ?? null,
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
