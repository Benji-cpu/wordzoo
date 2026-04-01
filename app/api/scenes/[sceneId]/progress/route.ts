import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { UpdateSceneProgressSchema } from '@/types/api';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db/client';
import { updateSceneProgress } from '@/lib/db/scene-flow-queries';

interface SceneProgress {
  learnedWordIds: string[];
}

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

  const rows = await sql`
    SELECT uw.word_id
    FROM scene_words sw
    JOIN user_words uw ON uw.word_id = sw.word_id AND uw.user_id = ${session.user.id}
    WHERE sw.scene_id = ${sceneId}
  `;

  return NextResponse.json<ApiResponse<SceneProgress>>({
    data: { learnedWordIds: rows.map((r) => (r as { word_id: string }).word_id) },
    error: null,
  });
}

export async function POST(
  request: NextRequest,
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
  const body = await request.json();
  const parsed = UpdateSceneProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { currentPhase, phaseIndex, phaseCompleted } = parsed.data;

  await updateSceneProgress(session.user.id, sceneId, {
    currentPhase: currentPhase as 'dialogue' | 'phrases' | 'vocabulary' | 'patterns' | 'summary',
    phaseIndex,
    phaseCompleted: phaseCompleted as 'dialogue' | 'phrases' | 'vocabulary' | 'patterns' | undefined,
  });

  return NextResponse.json<ApiResponse<{ success: boolean }>>({
    data: { success: true },
    error: null,
  });
}
