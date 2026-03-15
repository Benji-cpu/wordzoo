import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { getUserVocabWithMnemonics } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const languageId = request.nextUrl.searchParams.get('languageId');
  if (!languageId) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Missing languageId parameter' },
      { status: 400 }
    );
  }

  try {
    const vocab = await getUserVocabWithMnemonics(session.user.id, languageId);
    return NextResponse.json<ApiResponse<typeof vocab>>(
      { data: vocab, error: null }
    );
  } catch (error) {
    console.error('Vocabulary fetch error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to fetch vocabulary' },
      { status: 500 }
    );
  }
}
