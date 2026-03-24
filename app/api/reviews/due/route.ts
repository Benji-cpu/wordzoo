import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DueWordsQuerySchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { DueWordForReview } from '@/lib/db/queries';
import { getDueWords } from '@/lib/srs/engine';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const context = searchParams.get('context') ?? undefined;
  const parsed = DueWordsQuerySchema.safeParse({ context });
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  const dueWords = await getDueWords(session.user.id, 20, parsed.data.context);

  return NextResponse.json<ApiResponse<DueWordForReview[]>>(
    { data: dueWords, error: null }
  );
}
