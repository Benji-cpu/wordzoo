import { NextRequest, NextResponse } from 'next/server';
import { TutorSessionSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { startSession } from '@/lib/services/tutor-service';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`tutor:session:${ip}`);
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
  const parsed = TutorSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { mode, languageId, scenario } = parsed.data;
    const result = await startSession(session.user.id, mode, languageId, scenario, session.user.name);
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
