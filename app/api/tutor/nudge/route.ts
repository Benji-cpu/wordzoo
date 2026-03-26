import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { NudgeQuerySchema, NudgeActionSchema } from '@/types/api';
import { auth } from '@/lib/auth';
import {
  getActiveNudge,
  recordNudgeShown,
  recordNudgeDismissed,
  recordNudgeAccepted,
} from '@/lib/services/nudge-service';
import type { NudgeResult } from '@/lib/services/nudge-service';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = NudgeQuerySchema.safeParse({
    languageId: searchParams.get('languageId'),
    page: searchParams.get('page'),
  });

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  try {
    const nudge = await getActiveNudge(session.user.id, parsed.data.languageId, parsed.data.page);

    // Mark as shown if returned
    if (nudge) {
      recordNudgeShown(nudge.id).catch(console.error);
    }

    return NextResponse.json<ApiResponse<NudgeResult | null>>({
      data: nudge,
      error: null,
    });
  } catch (error) {
    console.error('Nudge error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to get nudge' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = NudgeActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { nudgeId, action } = parsed.data;
    if (action === 'dismissed') {
      await recordNudgeDismissed(nudgeId);
    } else if (action === 'accepted') {
      await recordNudgeAccepted(nudgeId);
    }
    return NextResponse.json<ApiResponse<{ ok: true }>>({
      data: { ok: true },
      error: null,
    });
  } catch (error) {
    console.error('Nudge action error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to update nudge' },
      { status: 500 }
    );
  }
}
