import { NextRequest, NextResponse } from 'next/server';
import { StudioStartSchema, StudioChatSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { StudioMessage } from '@/types/database';
import { guardSpend } from '@/lib/spend-guard';
import { startStudioSession, handleStudioMessage } from '@/lib/services/studio-service';
import { readJson } from '@/lib/api/request';

export async function POST(request: NextRequest) {
  // Every turn is a Gemini call.
  const guard = await guardSpend('studio_chat');
  if (!guard.ok) return guard.response;

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const hasSessionId =
    typeof body === 'object' && body !== null && Boolean((body as { sessionId?: unknown }).sessionId);

  // Route based on whether sessionId is present in the body
  if (!hasSessionId) {
    // Start a new studio session
    const parsed = StudioStartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    try {
      const { languageId, prefillScenario } = parsed.data;
      const result = await startStudioSession(guard.userId, languageId, prefillScenario);

      return NextResponse.json<ApiResponse<{ sessionId: string; message: StudioMessage }>>({
        data: result,
        error: null,
      });
    } catch (error) {
      console.error('[app/api/studio/chat/route.ts]', error);
      const message = 'Failed to start studio session';
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: message },
        { status: 500 }
      );
    }
  } else {
    // Continue an existing studio session
    const parsed = StudioChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    try {
      const { sessionId, message, selections } = parsed.data;
      const tutorMessage = await handleStudioMessage(sessionId, guard.userId, message, selections);

      return NextResponse.json<ApiResponse<StudioMessage>>({
        data: tutorMessage,
        error: null,
      });
    } catch (error) {
      console.error('[app/api/studio/chat/route.ts]', error);
      const message = 'Failed to send studio message';
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: message },
        { status: 500 }
      );
    }
  }
}
