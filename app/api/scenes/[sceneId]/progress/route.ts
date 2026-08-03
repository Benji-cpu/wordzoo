import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { UpdateSceneProgressSchema } from '@/types/api';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db/client';
import { updateSceneProgress } from '@/lib/db/scene-flow-queries';
import { readJson } from '@/lib/api/request';
import {
  incrementDailyUsageScenesCompleted,
  getDailyLearningStats,
  verifySceneAccess,
} from '@/lib/db/queries';

interface SceneProgress {
  learnedWordIds: string[];
  dailyStats: { words_learned: number; scenes_completed: number };
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
  if (!(await verifySceneAccess(sceneId, session.user.id))) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Not found' },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().split('T')[0];

  const [rows, dailyStats] = await Promise.all([
    sql`
      SELECT uw.word_id
      FROM scene_words sw
      JOIN user_words uw ON uw.word_id = sw.word_id AND uw.user_id = ${session.user.id}
      WHERE sw.scene_id = ${sceneId}
    `,
    getDailyLearningStats(session.user.id, today),
  ]);

  return NextResponse.json<ApiResponse<SceneProgress>>({
    data: {
      learnedWordIds: rows.map((r) => (r as { word_id: string }).word_id),
      dailyStats,
    },
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
  if (!(await verifySceneAccess(sceneId, session.user.id))) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Not found' },
      { status: 404 }
    );
  }

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = UpdateSceneProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { currentPhase, phaseIndex, phaseCompleted, phaseStep, phaseBatch } = parsed.data;

  // Legacy 'patterns' / 'affixes' phases are forward-normalized to 'summary'
  // on the client before this route is called; accept both here defensively.
  const phase = (currentPhase === 'patterns' || currentPhase === 'affixes')
    ? 'summary'
    : currentPhase;
  const completed = (phaseCompleted === 'patterns' || phaseCompleted === 'affixes')
    ? undefined
    : phaseCompleted;

  await updateSceneProgress(session.user.id, sceneId, {
    currentPhase: phase as 'dialogue' | 'phrases' | 'vocabulary' | 'conversation' | 'summary',
    phaseIndex,
    phaseCompleted: completed as 'dialogue' | 'phrases' | 'vocabulary' | 'conversation' | undefined,
    completedAt: phase === 'summary' ? new Date() : undefined,
    phaseStep,
    phaseBatch,
  });

  // Track scene completion for pacing system
  if (currentPhase === 'summary') {
    const today = new Date().toISOString().split('T')[0];
    incrementDailyUsageScenesCompleted(session.user.id, today, 1).catch(() => {});
  }

  // Finishing a scene unlocks its can-dos, scheduled 48h out. Awaited rather
  // than fire-and-forget because SceneSummary renders "N can-dos unlocked"
  // immediately after this returns, and the insert is idempotent
  // (ON CONFLICT DO NOTHING) so replaying the summary is free.
  let canDosUnlocked = 0;
  if (phase === 'summary') {
    try {
      const { unlockCanDosForScene } = await import('@/lib/db/can-do-queries');
      canDosUnlocked = await unlockCanDosForScene(session.user.id, sceneId);
    } catch (error) {
      // Never fail a scene completion over this — the learner finished the
      // scene either way, and the next completion retries the insert.
      console.error('[scene-progress] can-do unlock failed:', error);
    }
  }

  return NextResponse.json<ApiResponse<{ success: boolean; canDosUnlocked: number }>>({
    data: { success: true, canDosUnlocked },
    error: null,
  });
}
