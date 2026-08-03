import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RecordReviewSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { recordReview } from '@/lib/srs/engine';
import { checkAccess } from '@/lib/services/billing-service';
import { getUserWord } from '@/lib/db/queries';
import { readJson } from '@/lib/api/request';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = RecordReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { wordId, direction, rating, source } = parsed.data;
  const userId = session.user.id;

  // Enforce the free-tier daily new-word limit only when this word is brand new
  // to the learner. Repeated reviews are always free.
  //
  // The gate used to be `!existing || existing.times_reviewed === 0`, which
  // double-charged the boundary. recordIntroduction is the idempotent single
  // owner of daily_usage.words_learned, so by the time a user_words row exists
  // the word has already been counted. `times_reviewed === 0` doesn't mean
  // "new", it means "introduced but not yet drilled" — precisely the state the
  // 5th word of the day is in when its first drill answer arrives. So the 5th
  // word was introduced successfully (words_learned -> 5) and then 403'd on the
  // answer, losing a word the learner was entitled to. `!existing` alone opens
  // no loophole: recordReview calls recordIntroduction, so the counter still
  // moves and the NEXT new word is correctly blocked.
  const existing = await getUserWord(userId, wordId);
  let remaining: number | null = null;
  if (!existing) {
    const access = await checkAccess(userId, 'new_word');
    if (!access.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: access.upgradeMessage ?? 'Daily word limit reached' },
        { status: 403 }
      );
    }
    // null limit = unlimited (premium/admin); the header is then omitted
    // entirely, matching X-Tutor-Messages-Remaining's "absent means unlimited".
    if (typeof access.limit === 'number' && typeof access.currentUsage === 'number') {
      remaining = Math.max(0, access.limit - access.currentUsage - 1);
    }
  }

  const result = await recordReview(userId, wordId, direction, rating, source);

  return NextResponse.json<ApiResponse<{ nextReviewAt: Date; newInterval: number }>>(
    { data: result, error: null },
    remaining === null ? undefined : { headers: { 'X-Words-Remaining': String(remaining) } }
  );
}
