import { NextRequest, NextResponse } from 'next/server';
import { TutorMessageSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { sendMessage } from '@/lib/services/tutor-service';
import { checkAccess, incrementUsage } from '@/lib/services/billing-service';
import { isAiUnavailable } from '@/lib/ai/gemini';
import { readJson } from '@/lib/api/request';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
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
        { status: 403, headers: { 'X-Tutor-Messages-Remaining': '0' } }
      );
    }

    const { sessionId, message, challengeMode } = parsed.data;
    // Throws before any usage is counted if the model is unavailable, so a
    // failed send never costs the learner one of their daily messages.
    const { stream, completePromise, isLastTurn } = await sendMessage(sessionId, session.user.id, message, session.user.name, challengeMode);

    // Increment usage after sending
    await incrementUsage(session.user.id, 'tutor_message');

    // Compute remaining tutor messages for the client. Admin/premium have null limit → unlimited.
    const remainingHeader = access.limit === null
      ? 'unlimited'
      : String(Math.max(0, access.limit - ((access.currentUsage ?? 0) + 1)));

    // Fire and forget: save model message after stream completes
    completePromise.catch((err) => console.error('Failed to save tutor message:', err));

    const byteStream = stream.pipeThrough(new TextEncoderStream());
    return new Response(byteStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
        'X-Session-Auto-End': isLastTurn ? 'true' : 'false',
        'X-Tutor-Messages-Remaining': remainingHeader,
      },
    });
  } catch (error) {
    console.error('[app/api/tutor/message/route.ts]', error);

    // Model capacity/availability problems are transient and the learner can
    // simply try again — they are NOT the generic 500 the UI used to render as
    // a dead-end "Failed to send message". AiUnavailableError carries a
    // client-safe message and the right status; nothing else is echoed back.
    if (isAiUnavailable(error)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        {
          status: error.status,
          // Honest signal: a rejected request (bad key, malformed call) will
          // fail identically on retry, so the client must not offer one.
          headers: { 'X-Tutor-Retryable': error.retryable ? 'true' : 'false' },
        }
      );
    }

    // Branch on the thrown message to pick a status, but never return it —
    // only these known sentinels map to a client-safe response.
    const raw = error instanceof Error ? error.message : '';
    const status =
      raw === 'Unauthorized' ? 403
      : raw === 'Session not found' ? 404
      : raw === 'Session has ended' ? 409
      : 500;
    const message =
      status === 403 ? 'Unauthorized'
      : status === 404 ? 'Session not found'
      : status === 409 ? 'This session has already ended. Start a new one to keep practising.'
      : 'Something went wrong sending your message. Please try again.';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      {
        status,
        // Only an unclassified failure is worth another attempt. A missing or
        // already-ended session resolves the same way every time, so the
        // client must not dangle a Retry button in front of it.
        headers: { 'X-Tutor-Retryable': status === 500 ? 'true' : 'false' },
      }
    );
  }
}
