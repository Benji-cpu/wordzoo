import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db/client';
import type { ApiResponse } from '@/types/api';

const RecordShareSchema = z.object({
  mnemonicId: z.string().uuid(),
  format: z.enum(['square', 'story', 'video', 'link']),
  channel: z.string().trim().max(40).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = RecordShareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    );
  }
  const { mnemonicId, format, channel } = parsed.data;

  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Fire-and-forget telemetry. Failures must never break the share UX.
  try {
    await sql`
      INSERT INTO mnemonic_shares (mnemonic_id, user_id, format, channel)
      VALUES (${mnemonicId}, ${userId}, ${format}, ${channel ?? null})
    `;
  } catch {
    // swallow — analytics best-effort
  }

  return NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true }, error: null });
}
