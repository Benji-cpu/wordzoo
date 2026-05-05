import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db/client';
import type { ApiResponse } from '@/types/api';

const TelemetrySchema = z.object({
  event: z.string().min(1).max(64),
  payload: z.record(z.string(), z.unknown()).optional(),
  ts: z.number().optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid JSON' },
      { status: 400 },
    );
  }

  const parsed = TelemetrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid input' },
      { status: 400 },
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (process.env.NODE_ENV !== 'production') {
    console.log('[pedagogy:telemetry]', {
      userId,
      event: parsed.data.event,
      payload: parsed.data.payload ?? {},
    });
  }

  // Persist when authenticated. Anonymous events are dropped (the beacon
  // path is best-effort by design — admins watching the rollout always
  // have a session). Insert failure must NOT break the response.
  if (userId) {
    try {
      const payload = parsed.data.payload ?? {};
      await sql`
        INSERT INTO pedagogy_events (user_id, event, payload)
        VALUES (${userId}, ${parsed.data.event}, ${JSON.stringify(payload)}::jsonb)
      `;
    } catch (err) {
      console.error('[pedagogy:telemetry] insert failed', err);
    }
  }

  return NextResponse.json<ApiResponse<{ ok: true }>>(
    { data: { ok: true }, error: null },
    { status: 202 },
  );
}
