import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import { getInsightState, markInsightShown, markInsightDismissed } from '@/lib/db/insight-queries';
import type { ApiResponse } from '@/types/api';

const InsightActionSchema = z.object({
  insightId: z.string().min(1).max(50),
  action: z.enum(['shown', 'dismissed']),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const state = await getInsightState(session.user.id);
    return NextResponse.json<ApiResponse<{ seenIds: string[]; shownToday: number }>>({
      data: { seenIds: Array.from(state.seenIds), shownToday: state.shownToday },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch insight state';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const parsed = InsightActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.action === 'shown') {
      await markInsightShown(session.user.id, parsed.data.insightId);
    } else {
      await markInsightDismissed(session.user.id, parsed.data.insightId);
    }

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      data: { success: true },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update insight';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
