import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import { incrementUsage } from '@/lib/services/billing-service';
import type { ApiResponse } from '@/types/api';

const CompleteSchema = z.object({
  // Client-declared, and the server has no way to verify it — hands-free uses
  // the browser's own SpeechSynthesis, so there is no server-side spend to
  // correlate against. 900s (15 min) is a generous single session and keeps a
  // fabricated value from being wildly out of band. Was 7200 (2 hours).
  durationSeconds: z.number().int().min(0).max(900),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    );
  }

  const { durationSeconds } = parsed.data;
  if (durationSeconds > 0) {
    await incrementUsage(session.user.id, 'hands_free', durationSeconds);
  }

  return NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true }, error: null });
}
