import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { getActiveTutorSession, getTutorMessages } from '@/lib/db';
import { endSession } from '@/lib/services/tutor-service';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
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

  const userId = session.user.id;
  const tutorSession = await getActiveTutorSession(userId, languageId);

  if (!tutorSession) {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: null });
  }

  // Check if session is expired (> 24h old)
  const ageMs = Date.now() - new Date(tutorSession.started_at).getTime();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  if (ageMs > TWENTY_FOUR_HOURS) {
    // Fire-and-forget: end the expired session in background
    endSession(tutorSession.id, userId).catch(() => {});
    return NextResponse.json<ApiResponse<null>>({ data: null, error: null });
  }

  // Active session — fetch messages
  const messages = await getTutorMessages(tutorSession.id, 1000);

  return NextResponse.json<ApiResponse<{
    session: { id: string; mode: string; scenario: string | null; started_at: Date };
    messages: { role: string; content: string }[];
  }>>({
    data: {
      session: {
        id: tutorSession.id,
        mode: tutorSession.mode,
        scenario: tutorSession.scenario,
        started_at: tutorSession.started_at,
      },
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    },
    error: null,
  });
}
