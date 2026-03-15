import { NextRequest, NextResponse } from 'next/server';
import { SceneIdParamSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { verifySceneAccess } from '@/lib/db';
import { getSceneForLearning } from '@/lib/services/path-service';
import type { SceneLearningData } from '@/lib/services/path-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { sceneId } = await params;
  const parsed = SceneIdParamSchema.safeParse({ sceneId });
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid sceneId parameter' },
      { status: 400 }
    );
  }

  const hasAccess = await verifySceneAccess(parsed.data.sceneId, session.user.id);
  if (!hasAccess) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Scene not found' },
      { status: 404 }
    );
  }

  try {
    const sceneData = await getSceneForLearning(session.user.id, parsed.data.sceneId);
    if (!sceneData) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Scene not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<SceneLearningData>>({
      data: sceneData,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch scene';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
