import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth, signOut } from '@/lib/auth';
import {
  deleteUserCascade,
  getSubscriptionByUserId,
  getUserProfile,
} from '@/lib/db/queries';
import { stripe } from '@/lib/billing/stripe';
import type { ApiResponse } from '@/types/api';

const DeleteSchema = z.object({
  confirmEmail: z.string().email(),
});

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Please confirm your email to delete.' },
      { status: 400 }
    );
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'User not found' },
      { status: 404 }
    );
  }

  if (profile.email.toLowerCase() !== parsed.data.confirmEmail.toLowerCase()) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Email confirmation did not match.' },
      { status: 400 }
    );
  }

  // Cancel active Stripe subscription if any — runs best-effort; DB delete still proceeds on failure
  const sub = await getSubscriptionByUserId(session.user.id);
  if (sub?.stripe_subscription_id && sub.status === 'active') {
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    } catch (err) {
      console.error('Stripe cancel during account deletion failed:', err);
    }
  }

  await deleteUserCascade(session.user.id);
  await signOut({ redirect: false });

  return NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true }, error: null });
}
