import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { getImageCoverageStats, type ImageCoverageStats } from '@/lib/db/admin-queries';

export async function GET() {
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

  try {
    const stats = await getImageCoverageStats();
    return NextResponse.json<ApiResponse<ImageCoverageStats>>({
      data: stats,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch coverage stats';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
