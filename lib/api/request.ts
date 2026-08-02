/**
 * Safe request-body parsing.
 *
 * `await request.json()` throws on a malformed body, and most route handlers
 * called it unguarded — so a truncated or non-JSON POST produced an opaque 500
 * instead of a 400. This extracts the pattern that was already correct in
 * app/api/trip/preview/route.ts.
 *
 * Usage:
 *   const body = await readJson(request);
 *   if (!body.ok) return body.response;
 *   const parsed = SomeSchema.safeParse(body.data);
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';

export type ReadJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse };

export async function readJson(request: Request): Promise<ReadJsonResult> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 },
      ),
    };
  }
}
