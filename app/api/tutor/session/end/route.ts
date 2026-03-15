import { NextRequest, NextResponse } from 'next/server';
import { TutorEndSessionSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { endSession } from '@/lib/services/tutor-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
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
    const message = error instanceof Error ? error.message : 'Failed to end session';
    const status = message === 'Unauthorized' ? 403 : message === 'Session not found' ? 404 : 500;
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status }
    );
  }
}
