import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RecordPhraseReviewSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { recordPhraseReview } from '@/lib/srs/engine';
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
  const parsed = RecordPhraseReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { phraseId, rating, source } = parsed.data;
  const result = await recordPhraseReview(session.user.id, phraseId, rating, source);

  return NextResponse.json<ApiResponse<{ nextReviewAt: Date; newInterval: number }>>(
    { data: result, error: null }
  );
}
