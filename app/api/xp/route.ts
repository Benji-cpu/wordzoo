import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/auth/admin';
import { claimSpend } from '@/lib/spend-ledger';
import { addUserXp, getUserXp } from '@/lib/db/queries';
import type { ApiResponse } from '@/types/api';
import { readJson } from '@/lib/api/request';

const AddXpSchema = z.object({
  amount: z.number().int().min(1).max(500),
  reason: z.enum([
    'correct_answer',
    'phrase_complete',
    'word_learned',
    'scene_complete',
    'review_session',
    'streak_milestone',
    'cloze_correct',
    'production_correct',
    'checkpoint_passed',
    'phrase_drill_correct',
    'phrase_production_correct',
    'phrase_checkpoint_passed',
    'can_do_certified',
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
  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = AddXpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 },
    );
  }

  // XP is entirely client-declared — the server can't verify the claimed event
  // happened. It's cosmetic (level badge), so rather than rebuild it as a
  // server-derived stat we just cap the daily total. 3000/day is far above a
  // heavy session (a full scene is ~25 XP) and stops a trivial award loop.
  if (!isAdminEmail(session.user.email)) {
    const affordable = await claimSpend(`user:${session.user.id}`, 'xp_award', {
      units: parsed.data.amount,
    });
    if (!affordable) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Daily XP limit reached' },
        { status: 429 },
      );
    }
  }

  const data = await addUserXp(
    session.user.id,
    parsed.data.amount,
    parsed.data.reason,
  );
  return NextResponse.json<ApiResponse<typeof data>>({ data, error: null });
}
