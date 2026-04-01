import { NextRequest, NextResponse } from 'next/server';
import { TutorMessageSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { sendMessage } from '@/lib/services/tutor-service';
import { checkAccess, incrementUsage } from '@/lib/services/billing-service';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`tutor:message:${ip}`);
  if (!allowed) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = TutorMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    // Check billing access
    const access = await checkAccess(session.user.id, 'tutor_message');
    if (!access.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: access.upgradeMessage ?? 'Daily limit reached' },
        { status: 403 }
      );
    }

    const { sessionId, message } = parsed.data;
    const { stream, completePromise } = await sendMessage(sessionId, session.user.id, message, session.user.name);

    // Increment usage after sending
    await incrementUsage(session.user.id, 'tutor_message');

    // Fire and forget: save model message after stream completes
    completePromise.catch((err) => console.error('Failed to save tutor message:', err));

    const byteStream = stream.pipeThrough(new TextEncoderStream());
    return new Response(byteStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    const status = message === 'Unauthorized' ? 403 : message === 'Session not found' ? 404 : 500;
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status }
    );
  }
}
