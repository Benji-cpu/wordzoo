import { NextRequest, NextResponse } from 'next/server';
import { DueWordsQuerySchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { UserWord } from '@/types/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const context = searchParams.get('context') ?? undefined;
  const parsed = DueWordsQuerySchema.safeParse({ context });
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  return NextResponse.json<ApiResponse<UserWord[]>>(
    { data: null, error: 'Not implemented' },
    { status: 501 }
  );
}
