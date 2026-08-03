import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { createTravelPackCheckout } from '@/lib/billing/stripe';
import { readJson } from '@/lib/api/request';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:8000';

// Whitelist of allowed success/cancel paths to prevent open-redirect via Stripe metadata.
const ALLOWED_RETURN_PATHS = ['/paths', '/trip', '/dashboard'];

function safeReturnUrl(input: string | undefined, fallback: string): string {
  if (!input) return `${APP_URL}${fallback}`;
  if (!input.startsWith('/')) return `${APP_URL}${fallback}`;
  const ok = ALLOWED_RETURN_PATHS.some((p) => input === p || input.startsWith(`${p}/`) || input.startsWith(`${p}?`));
  if (!ok) return `${APP_URL}${fallback}`;
  return `${APP_URL}${input}`;
}

const Body = z.object({
  packId: z.string().uuid(),
  successPath: z.string().max(500).optional(),
  cancelPath: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const successUrl = safeReturnUrl(parsed.data.successPath, '/paths?purchased=true');
    const cancelUrl = safeReturnUrl(parsed.data.cancelPath, '/paths?canceled=true');
    const url = await createTravelPackCheckout(session.user.id, parsed.data.packId, {
      successUrl,
      cancelUrl,
    });
    return NextResponse.json<ApiResponse<{ url: string }>>({
      data: { url },
      error: null,
    });
  } catch (error) {
    console.error('[app/api/billing/travel-pack/route.ts]', error);
    const message = 'Failed to create checkout session';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
