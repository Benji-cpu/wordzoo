import { NextRequest, NextResponse } from 'next/server';
import { SubmitFeedbackSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { MnemonicFeedback } from '@/types/database';
import { auth } from '@/lib/auth';
import { submitMnemonicFeedback } from '@/lib/services/feedback-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = SubmitFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { mnemonicId, rating, comment } = parsed.data;
    const userId = session.user.id;

    const feedback = await submitMnemonicFeedback(userId, mnemonicId, rating, comment);

    return NextResponse.json<ApiResponse<MnemonicFeedback>>({
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
