import { NextRequest, NextResponse } from 'next/server';
import { CheckoutSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/billing/stripe';
import { readJson } from '@/lib/api/request';

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
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const url = await createCheckoutSession(session.user.id, parsed.data.plan);
    return NextResponse.json<ApiResponse<{ url: string }>>({
      data: { url },
      error: null,
    });
  } catch (error) {
    console.error('[app/api/billing/checkout/route.ts]', error);
    const message = 'Failed to create checkout session';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
