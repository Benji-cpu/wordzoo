import { NextRequest, NextResponse } from 'next/server';
import { PathIdParamSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { verifyPathAccess } from '@/lib/db';
import { getNextScene } from '@/lib/services/path-service';
import type { NextSceneData } from '@/lib/services/path-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pathId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { pathId } = await params;
  const parsed = PathIdParamSchema.safeParse({ pathId });
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid pathId parameter' },
      { status: 400 }
    );
  }

  const hasAccess = await verifyPathAccess(parsed.data.pathId, session.user.id);
  if (!hasAccess) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Path not found' },
      { status: 404 }
    );
  }

  try {
    const nextScene = await getNextScene(session.user.id, parsed.data.pathId);
    return NextResponse.json<ApiResponse<NextSceneData>>({
      data: nextScene,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch next scene';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
