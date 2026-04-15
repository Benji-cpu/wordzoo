import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SubmitAppFeedbackSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { AppFeedback } from '@/types/database';
import { insertAppFeedback } from '@/lib/services/app-feedback-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const parsed = SubmitAppFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const feedback = await insertAppFeedback(session.user.id, parsed.data);
    return NextResponse.json<ApiResponse<AppFeedback>>({
      data: feedback,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit feedback';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
