import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserActivePath } from '@/lib/db/queries';
import { getDueCanDos, type DueCanDo } from '@/lib/db/can-do-queries';
import type { ApiResponse } from '@/types/api';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 5;

/**
 * Can-dos this learner can certify right now, in their active path's language.
 * The review sitting asks for one, after its cards are done. The rows carry
 * the statement and the English prompt only: the answer never leaves the
 * server before a verdict (see getDueCanDos).
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const raw = Number(request.nextUrl.searchParams.get('limit') ?? '1');
  const limit = Number.isInteger(raw) && raw >= 1 ? Math.min(raw, MAX_LIMIT) : 1;

  try {
    const activePath = await getUserActivePath(session.user.id);
    const canDos = await getDueCanDos(session.user.id, limit, activePath?.path_language_id ?? null);
    return NextResponse.json<ApiResponse<DueCanDo[]>>({ data: canDos, error: null });
  } catch (error) {
    console.error('[app/api/can-dos/due/route.ts]', error);
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to load can-dos' }, { status: 500 });
  }
}
