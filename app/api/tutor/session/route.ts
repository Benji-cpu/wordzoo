import { NextRequest, NextResponse } from 'next/server';
import { TutorSessionSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { guardSpend } from '@/lib/spend-guard';
import { startSession } from '@/lib/services/tutor-service';

export async function POST(request: NextRequest) {
  // Starting a session generates an AI greeting, so it costs a Gemini call
  // even though it never touches the 3/day message budget.
  const guard = await guardSpend('tutor_greeting');
  if (!guard.ok) return guard.response;

  const session = await auth();

  const body = await request.json();
  const parsed = TutorSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { mode, languageId, scenario, focusWordIds } = parsed.data;
    const result = await startSession(guard.userId, mode, languageId, scenario, session?.user?.name, focusWordIds);
    return NextResponse.json<ApiResponse<typeof result>>(
      { data: result, error: null }
    );
  } catch (error) {
    console.error('Tutor session error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to start tutor session' },
      { status: 500 }
    );
  }
}
