import { NextRequest, NextResponse } from 'next/server';
import { RecordReviewSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = RecordReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  return NextResponse.json<ApiResponse<null>>(
    { data: null, error: 'Not implemented' },
    { status: 501 }
  );
}
