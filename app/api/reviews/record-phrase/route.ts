import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RecordPhraseReviewSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { recordPhraseReview } from '@/lib/srs/engine';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = RecordPhraseReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { phraseId, rating } = parsed.data;
  const result = await recordPhraseReview(session.user.id, phraseId, rating);

  return NextResponse.json<ApiResponse<{ nextReviewAt: Date; newInterval: number }>>(
    { data: result, error: null }
  );
}
