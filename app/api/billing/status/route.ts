import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { getSubscriptionStatus, getDailyUsageForUser } from '@/lib/services/billing-service';

export async function GET() {
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
    console.error('[billing/status] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get billing status';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
