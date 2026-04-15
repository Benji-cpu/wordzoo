import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppFeedbackQuerySchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { getAppFeedbackStats, getAppFeedbackList } from '@/lib/db/admin-queries';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  if (!adminEmails.includes(session.user.email!)) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = AppFeedbackQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  try {
    const { status, page } = parsed.data;
    const limit = 20;
    const offset = (page - 1) * limit;

    const [stats, items] = await Promise.all([
      getAppFeedbackStats(),
      getAppFeedbackList(limit, offset, status),
    ]);

    return NextResponse.json<ApiResponse<{ stats: typeof stats; items: typeof items }>>({
      data: { stats, items },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch app feedback';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
