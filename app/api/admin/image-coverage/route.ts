import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { getImageCoverageStats, type ImageCoverageStats } from '@/lib/db/admin-queries';
import { isAdminEmail } from '@/lib/auth/admin';

export async function GET() {
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

  try {
    const stats = await getImageCoverageStats();
    return NextResponse.json<ApiResponse<ImageCoverageStats>>({
      data: stats,
      error: null,
    });
  } catch (error) {
    console.error('[app/api/admin/image-coverage/route.ts]', error);
    const message = 'Failed to fetch coverage stats';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
