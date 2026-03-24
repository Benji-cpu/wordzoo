import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RecordReviewSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { recordReview } from '@/lib/srs/engine';

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
  const result = await recordReview(session.user.id, wordId, direction, rating);

  return NextResponse.json<ApiResponse<{ nextReviewAt: Date; newInterval: number }>>(
    { data: result, error: null }
  );
}
