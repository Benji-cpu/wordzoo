import { NextRequest, NextResponse } from 'next/server';
import { TutorEndSessionSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { endSession } from '@/lib/services/tutor-service';
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
  const parsed = TutorEndSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const summary = await endSession(parsed.data.sessionId, session.user.id);
    return NextResponse.json<ApiResponse<typeof summary>>(
      { data: summary, error: null }
    );
  } catch (error) {
    console.error('[app/api/tutor/session/end/route.ts]', error);
    // Branch on the thrown message to pick a status, but never return it —
    // only these two known sentinels map to a client-safe response.
    const raw = error instanceof Error ? error.message : '';
    const status = raw === 'Unauthorized' ? 403 : raw === 'Session not found' ? 404 : 500;
    const message =
      status === 403 ? 'Unauthorized'
      : status === 404 ? 'Session not found'
      : 'Failed to end session';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status }
    );
  }
}
