import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/billing/stripe';
import { generateStudioPath } from '@/lib/services/studio-service';
import {
  insertStudioPathPurchase,
  getStudioPathPurchaseBySessionId,
  consumeStudioPathPurchase,
} from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  const studioSessionId = request.nextUrl.searchParams.get('studio_session');

  if (!sessionId || !studioSessionId) {
    return NextResponse.redirect(new URL('/paths/studio?error=invalid_callback', request.url));
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = checkoutSession.metadata?.userId;
    if (!userId || checkoutSession.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/paths/studio?error=payment_failed', request.url));
    }

    // Ensure purchase is recorded even if webhook hasn't landed yet — idempotent via UNIQUE on stripe_session_id
    const paymentIntent = checkoutSession.payment_intent
      ? (typeof checkoutSession.payment_intent === 'string'
          ? checkoutSession.payment_intent
          : checkoutSession.payment_intent.id)
      : null;

    await insertStudioPathPurchase({
      userId,
      stripeSessionId: sessionId,
      studioSessionId,
      stripePaymentId: paymentIntent,
    });

    // Already consumed (user refreshed or retried after successful generation) → redirect to existing path
    const existing = await getStudioPathPurchaseBySessionId(sessionId);
    if (existing?.path_id) {
      return NextResponse.redirect(new URL(`/paths/${existing.path_id}`, request.url));
    }

    const path = await generateStudioPath(studioSessionId, userId);

    if (existing && !existing.consumed_at) {
      await consumeStudioPathPurchase(existing.id, path.id);
    }

    return NextResponse.redirect(new URL(`/paths/${path.id}`, request.url));
  } catch (error) {
    console.error('Studio generate-callback error:', error);
    // Purchase record (if created) survives; user can retry from the studio page
    return NextResponse.redirect(
      new URL(`/paths/studio?error=generation_failed&studio_session=${studioSessionId}`, request.url)
    );
  }
}
