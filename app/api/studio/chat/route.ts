import { NextRequest, NextResponse } from 'next/server';
import { StudioStartSchema, StudioChatSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { StudioMessage } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { startStudioSession, handleStudioMessage } from '@/lib/services/studio-service';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`studio:chat:${ip}`);
  if (!allowed) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();

  // Route based on whether sessionId is present in the body
  if (!body.sessionId) {
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
      const result = await startStudioSession(session.user.id, languageId, prefillScenario);

      return NextResponse.json<ApiResponse<{ sessionId: string; message: StudioMessage }>>({
        data: result,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start studio session';
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
      const tutorMessage = await handleStudioMessage(sessionId, session.user.id, message, selections);

      return NextResponse.json<ApiResponse<StudioMessage>>({
        data: tutorMessage,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send studio message';
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: message },
        { status: 500 }
      );
    }
  }
}
