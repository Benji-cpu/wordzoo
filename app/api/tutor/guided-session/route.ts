import { NextRequest, NextResponse } from 'next/server';
import { StartGuidedSessionSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { guardSpend } from '@/lib/spend-guard';
import { startGuidedSession } from '@/lib/services/tutor-service';
import { isAiUnavailable } from '@/lib/ai/gemini';
import { getSceneWithLanguage, verifySceneAccess } from '@/lib/db/queries';
import { readJson } from '@/lib/api/request';

export async function POST(request: NextRequest) {
  const guard = await guardSpend('tutor_greeting');
  if (!guard.ok) return guard.response;

  const session = await auth();

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
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
    if (!scene || !(await verifySceneAccess(sceneId, guard.userId))) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Scene not found' },
        { status: 404 }
      );
    }

    const result = await startGuidedSession(
      guard.userId,
      scene.language_id,
      sceneId,
      scene.scene_context ?? scene.scene_title,
      session?.user?.name
    );

    return NextResponse.json<ApiResponse<typeof result>>(
      { data: result, error: null }
    );
  } catch (error) {
    console.error('Guided session error:', error instanceof Error ? error.stack : error);
    // Surface model capacity problems as their own status + message so the
    // learner knows to wait a moment rather than assuming the scene is broken.
    if (isAiUnavailable(error)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Could not start conversation. Please try again.' },
      { status: 500 }
    );
  }
}
