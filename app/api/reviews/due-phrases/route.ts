import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';
import type { DuePhraseForReview } from '@/lib/db/scene-flow-queries';
import { getDuePhrases } from '@/lib/srs/engine';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const duePhrases = await getDuePhrases(session.user.id, 20);

  return NextResponse.json<ApiResponse<DuePhraseForReview[]>>(
    { data: duePhrases, error: null }
  );
}
