import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BatchSyncSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { SyncResult } from '@/types/offline';
import { processBatchSync } from '@/lib/services/sync-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = BatchSyncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const result = await processBatchSync(session.user.id, parsed.data.events);
    return NextResponse.json<ApiResponse<SyncResult>>({
      data: result,
      error: null,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
