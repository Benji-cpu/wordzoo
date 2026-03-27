import { NextRequest, NextResponse } from 'next/server';
import { PathBuilderActionSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import {
  getDraftBySessionId,
  handleVocabAction,
  updateDraftPhase,
} from '@/lib/services/path-builder-service';
import { getTutorSessionById } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = PathBuilderActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { sessionId, action, itemType, tempId } = parsed.data;

    const tutorSession = await getTutorSessionById(sessionId);
    if (!tutorSession || tutorSession.user_id !== session.user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (tutorSession.mode !== 'path_builder') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Not a path builder session' },
        { status: 400 }
      );
    }

    const draft = await getDraftBySessionId(sessionId);
    if (!draft) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No draft found for this session' },
        { status: 404 }
      );
    }

    if (action === 'advance_phase') {
      const phaseOrder = ['discovery', 'vocabulary', 'phrases', 'dialogues', 'confirm', 'completed'] as const;
      const currentIdx = phaseOrder.indexOf(draft.current_phase as typeof phaseOrder[number]);
      if (currentIdx < 0 || currentIdx >= phaseOrder.length - 1) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Cannot advance from current phase' },
          { status: 400 }
        );
      }

      if (draft.current_phase === 'vocabulary') {
        const keptCount = draft.draft_content.vocabulary.filter((v) => v.status === 'kept').length;
        if (keptCount === 0) {
          return NextResponse.json<ApiResponse<null>>(
            { data: null, error: 'Keep at least one vocabulary word before advancing' },
            { status: 400 }
          );
        }
      }

      const nextPhase = phaseOrder[currentIdx + 1];
      await updateDraftPhase(draft.id, nextPhase);
      return NextResponse.json<ApiResponse<{ phase: string }>>(
        { data: { phase: nextPhase }, error: null }
      );
    }

    if ((action === 'keep' || action === 'remove') && itemType === 'vocabulary' && tempId) {
      const updatedContent = await handleVocabAction(draft.id, tempId, action);
      return NextResponse.json<ApiResponse<{ content: typeof updatedContent }>>(
        { data: { content: updatedContent }, error: null }
      );
    }

    if (action === 'different' && itemType === 'vocabulary' && tempId) {
      const updatedContent = await handleVocabAction(draft.id, tempId, 'remove');
      return NextResponse.json<ApiResponse<{ content: typeof updatedContent; needsAlternative: boolean }>>(
        { data: { content: updatedContent, needsAlternative: true }, error: null }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
