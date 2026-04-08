import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import {
  getUserDueWords,
  getLastTutorSession,
  getLastGuidedSessionForScene,
  getUserActivePath,
  getSceneMasteryForPath,
} from '@/lib/db';

export interface TutorRecommendation {
  type: 'due_words' | 'continue_session' | 'practice_scene' | 'next_scene' | 'fallback';
  dueWordCount?: number;
  lastMode?: string;
  lastScenario?: string | null;
  sceneTitle?: string;
  sceneId?: string;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const languageId = request.nextUrl.searchParams.get('languageId');
  if (!languageId) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'languageId is required' },
      { status: 400 }
    );
  }

  try {
    const userId = session.user.id;

    const [dueWords, lastSession, activePath] = await Promise.all([
      getUserDueWords(userId, languageId),
      getLastTutorSession(userId, languageId),
      getUserActivePath(userId),
    ]);

    // Priority 1: Due words
    if (dueWords.length >= 5) {
      return NextResponse.json<ApiResponse<TutorRecommendation>>({
        data: {
          type: 'due_words',
          dueWordCount: dueWords.length,
        },
        error: null,
      });
    }

    // Priority 2: Continue recent session
    if (lastSession) {
      const endedAt = new Date(lastSession.ended_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (endedAt > sevenDaysAgo) {
        return NextResponse.json<ApiResponse<TutorRecommendation>>({
          data: {
            type: 'continue_session',
            lastMode: lastSession.mode,
            lastScenario: lastSession.scenario,
          },
          error: null,
        });
      }
    }

    // Priority 3: Practice recently completed scene that hasn't had guided tutor session
    if (activePath) {
      const scenes = await getSceneMasteryForPath(userId, activePath.path_id);
      const recentlyCompleted = scenes
        .filter((s) => s.scene_completed)
        .slice(-1)[0]; // most recently completed
      if (recentlyCompleted) {
        const guidedSession = await getLastGuidedSessionForScene(userId, recentlyCompleted.id);
        if (!guidedSession) {
          return NextResponse.json<ApiResponse<TutorRecommendation>>({
            data: {
              type: 'practice_scene',
              sceneTitle: recentlyCompleted.title,
              sceneId: recentlyCompleted.id,
            },
            error: null,
          });
        }
      }

      // Priority 4: Next incomplete scene on active path
      const nextScene = scenes.find((s) => !s.scene_completed);
      if (nextScene) {
        return NextResponse.json<ApiResponse<TutorRecommendation>>({
          data: {
            type: 'next_scene',
            sceneTitle: nextScene.title,
            sceneId: nextScene.id,
          },
          error: null,
        });
      }
    }

    // Priority 4: Fallback
    return NextResponse.json<ApiResponse<TutorRecommendation>>({
      data: { type: 'fallback' },
      error: null,
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to get recommendation' },
      { status: 500 }
    );
  }
}
