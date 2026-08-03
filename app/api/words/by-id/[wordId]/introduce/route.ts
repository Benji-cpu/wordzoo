import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recordIntroduction } from '@/lib/db/queries';
import { checkAccess } from '@/lib/services/billing-service';
import type { ApiResponse } from '@/types/api';

interface IntroduceResponse {
  allowed: boolean;
  alreadyIntroduced: boolean;
  upgradeMessage: string | null;
  currentUsage: number | null;
  limit: number | null;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ wordId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 },
    );
  }

  const { wordId } = await params;
  if (!wordId) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'wordId is required' },
      { status: 400 },
    );
  }

  // Gate against the daily new-word limit BEFORE we record the introduction.
  // The check itself is cheap (counts daily_usage row); recording is a single
  // INSERT…ON CONFLICT DO NOTHING.
  const access = await checkAccess(session.user.id, 'new_word');
  if (!access.allowed) {
    return NextResponse.json<ApiResponse<IntroduceResponse>>({
      data: {
        allowed: false,
        alreadyIntroduced: false,
        upgradeMessage: access.upgradeMessage,
        currentUsage: access.currentUsage,
        limit: access.limit,
      },
      error: null,
    });
  }

  const { alreadyIntroduced } = await recordIntroduction(session.user.id, wordId);

  // Absent header means unlimited (premium/admin), matching the convention
  // X-Tutor-Messages-Remaining already uses. Only a brand-new introduction
  // consumes quota, so a repeat leaves the count where it was.
  const remaining =
    typeof access.limit === 'number' && typeof access.currentUsage === 'number'
      ? Math.max(0, access.limit - access.currentUsage - (alreadyIntroduced ? 0 : 1))
      : null;

  return NextResponse.json<ApiResponse<IntroduceResponse>>(
    {
      data: {
        allowed: true,
        alreadyIntroduced,
        upgradeMessage: null,
        currentUsage: null,
        limit: null,
      },
      error: null,
    },
    remaining === null ? undefined : { headers: { 'X-Words-Remaining': String(remaining) } },
  );
}
