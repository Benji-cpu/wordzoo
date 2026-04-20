import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RecordReviewSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { recordReview } from '@/lib/srs/engine';
import { checkAccess } from '@/lib/services/billing-service';
import { getUserWord } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = RecordReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { wordId, direction, rating } = parsed.data;
  const userId = session.user.id;

  // Enforce free-tier daily new-word limit only when this is a brand-new word
  // (repeated reviews of already-learned words are always free).
  const existing = await getUserWord(userId, wordId);
  if (!existing || existing.times_reviewed === 0) {
    const access = await checkAccess(userId, 'new_word');
    if (!access.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: access.upgradeMessage ?? 'Daily word limit reached' },
        { status: 403 }
      );
    }
  }

  const result = await recordReview(userId, wordId, direction, rating);

  return NextResponse.json<ApiResponse<{ nextReviewAt: Date; newInterval: number }>>(
    { data: result, error: null }
  );
}
