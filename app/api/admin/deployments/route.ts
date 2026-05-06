import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import {
  fetchRecentVercelFailures,
  ingestFailures,
  recentFailures,
  TEAM_OWNER_EMAIL,
} from '@/lib/deployment-events';
import type { ApiResponse } from '@/types/api';

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim());
  if (!adminEmails.includes(session.user.email!)) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Forbidden' },
      { status: 403 }
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const days = Math.min(
    Number(req.nextUrl.searchParams.get('days') ?? 14),
    90
  );

  try {
    const rows = await recentFailures(days);
    return NextResponse.json<ApiResponse<typeof rows>>({
      data: rows,
      error: null,
    });
  } catch (e) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: `DB error: ${String(e)}` },
      { status: 500 }
    );
  }
}

const PostBody = z.object({
  action: z.literal('ingest'),
  sinceHours: z.number().int().positive().max(720).optional(),
});

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let parsed;
  try {
    parsed = PostBody.parse(await req.json());
  } catch (e) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: `Invalid body: ${String(e)}` },
      { status: 400 }
    );
  }

  const sinceMs = Date.now() - (parsed.sinceHours ?? 24) * 60 * 60 * 1000;

  try {
    const rows = await fetchRecentVercelFailures(sinceMs);
    const { inserted, skipped } = await ingestFailures(rows);
    const wrongAuthor = rows.filter(
      (r) =>
        r.commit_author_email !== null &&
        r.commit_author_email !== TEAM_OWNER_EMAIL
    );
    return NextResponse.json<ApiResponse<{
      fetched: number;
      inserted: number;
      skipped: number;
      wrong_author_count: number;
      wrong_authors: string[];
    }>>({
      data: {
        fetched: rows.length,
        inserted,
        skipped,
        wrong_author_count: wrongAuthor.length,
        wrong_authors: Array.from(
          new Set(
            wrongAuthor
              .map((r) => r.commit_author_email)
              .filter((e): e is string => e !== null)
          )
        ),
      },
      error: null,
    });
  } catch (e) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: `Ingest failed: ${String(e)}` },
      { status: 500 }
    );
  }
}
