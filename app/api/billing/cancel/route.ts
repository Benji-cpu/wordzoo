import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/billing/stripe';
import { getSubscriptionByUserId } from '@/lib/db/queries';
import type { ApiResponse } from '@/types/api';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const sub = await getSubscriptionByUserId(session.user.id);
  if (!sub?.stripe_subscription_id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'No active subscription found' },
      { status: 404 }
    );
  }

  try {
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    return NextResponse.json<ApiResponse<{ cancelAt: number | null }>>({
      data: { cancelAt: updated.cancel_at },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
    return NextResponse.json<ApiResponse<null>>({ data: null, error: message }, { status: 500 });
  }
}
