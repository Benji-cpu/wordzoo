import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import { addUserXp, getUserXp } from '@/lib/db/queries';
import type { ApiResponse } from '@/types/api';

const AddXpSchema = z.object({
  amount: z.number().int().min(1).max(500),
  reason: z.enum([
    'correct_answer',
    'phrase_complete',
    'word_learned',
    'scene_complete',
    'review_session',
    'streak_milestone',
  ]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 },
    );
  }
  const data = await getUserXp(session.user.id);
  return NextResponse.json<ApiResponse<typeof data>>({ data, error: null });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 },
    );
  }
  const body = await request.json();
  const parsed = AddXpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 },
    );
  }
  const data = await addUserXp(
    session.user.id,
    parsed.data.amount,
    parsed.data.reason,
  );
  return NextResponse.json<ApiResponse<typeof data>>({ data, error: null });
}
