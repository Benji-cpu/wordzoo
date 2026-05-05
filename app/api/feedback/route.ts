import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SubmitAppFeedbackSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { AppFeedback } from '@/types/database';
import { insertAppFeedback, FeedbackRateLimitError } from '@/lib/services/app-feedback-service';

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

  // Honeypot: any non-empty `website` value means it's a bot. Pretend success
  // so they don't retry, but skip the insert. Log for observability.
  if (parsed.data.website && parsed.data.website.length > 0) {
    console.warn('[feedback] honeypot triggered', {
      userId: session.user.id,
      pageUrl: parsed.data.pageUrl,
    });
    return NextResponse.json<ApiResponse<null>>({ data: null, error: null });
  }

  try {
    const feedback = await insertAppFeedback(session.user.id, parsed.data);
    return NextResponse.json<ApiResponse<AppFeedback>>({
      data: feedback,
      error: null,
    });
  } catch (error) {
    if (error instanceof FeedbackRateLimitError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Rate limit exceeded — try again later.' },
        { status: 429 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to submit feedback';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
