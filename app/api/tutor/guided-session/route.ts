import { NextRequest, NextResponse } from 'next/server';
import { StartGuidedSessionSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { startGuidedSession } from '@/lib/services/tutor-service';
import { getSceneWithLanguage } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = StartGuidedSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { sceneId } = parsed.data;

    const scene = await getSceneWithLanguage(sceneId);
    if (!scene) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Scene not found' },
        { status: 404 }
      );
    }

    const result = await startGuidedSession(
      session.user.id,
      scene.language_id,
      sceneId,
      scene.scene_context ?? scene.scene_title,
      session.user.name
    );

    return NextResponse.json<ApiResponse<typeof result>>(
      { data: result, error: null }
    );
  } catch (error) {
    console.error('Guided session error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to start guided conversation' },
      { status: 500 }
    );
  }
}
