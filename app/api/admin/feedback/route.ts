import { NextRequest, NextResponse } from 'next/server';
import { AdminFeedbackQuerySchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/auth/admin';
import {
  getFeedbackStats,
  getWorstMnemonics,
  getBestMnemonics,
  getFeedbackWithComments,
} from '@/lib/db/admin-queries';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = AdminFeedbackQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  try {
    const { sort, page } = parsed.data;
    const limit = 20;
    const offset = (page - 1) * limit;

    const stats = await getFeedbackStats();

    let mnemonics;
    let comments;

    if (sort === 'worst') {
      mnemonics = await getWorstMnemonics(limit, offset);
    } else if (sort === 'best') {
      mnemonics = await getBestMnemonics(limit, offset);
    } else {
      comments = await getFeedbackWithComments(limit, offset);
    }

    return NextResponse.json<ApiResponse<{ stats: typeof stats; mnemonics?: typeof mnemonics; comments?: typeof comments }>>({
      data: { stats, mnemonics, comments },
      error: null,
    });
  } catch (error) {
    console.error('[app/api/admin/feedback/route.ts]', error);
    const message = 'Failed to fetch feedback data';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
