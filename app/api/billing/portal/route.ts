import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { createPortalSession } from '@/lib/billing/stripe';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`billing:portal:${ip}`);
  if (!allowed) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const url = await createPortalSession(session.user.id);
    return NextResponse.json<ApiResponse<{ url: string }>>({
      data: { url },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create portal session';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
