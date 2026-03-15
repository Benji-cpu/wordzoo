import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { getSubscriptionStatus, getDailyUsageForUser } from '@/lib/services/billing-service';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`billing:status:${ip}`);
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
    const [subscription, usage] = await Promise.all([
      getSubscriptionStatus(session.user.id),
      getDailyUsageForUser(session.user.id),
    ]);

    return NextResponse.json<ApiResponse<{ subscription: typeof subscription; usage: typeof usage }>>({
      data: { subscription, usage },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get billing status';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
