import { NextRequest, NextResponse, after } from 'next/server';
import { stripe } from '@/lib/billing/stripe';
import { auth } from '@/lib/auth';
import { generateStudioPath } from '@/lib/services/studio-service';
import { enrichPath } from '@/lib/services/path-enrichment-service';
import {
  insertStudioPathPurchase,
  getStudioPathPurchaseBySessionId,
  consumeStudioPathPurchase,
} from '@/lib/db/queries';

// Path generation + post-response enrichment (mnemonics, images, TTS) need
// far more than the default budget; after() shares this route's duration.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  const studioSessionId = request.nextUrl.searchParams.get('studio_session');

  if (!sessionId || !studioSessionId) {
    return NextResponse.redirect(new URL('/paths/studio?error=invalid_callback', request.url));
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = checkoutSession.metadata ?? {};
    const userId = metadata.userId;

    // This route is middleware-bypassed and unauthenticated, and previously
    // checked only `metadata.userId && payment_status === 'paid'`. The Stripe
    // checkout URL exposes `cs_...` in plain sight, so ANY paid session — a
    // $4.99 travel pack, a subscription — could be replayed here to mint a
    // free $2.99 studio path. Assert the product, the amount, and that the
    // payment was made for THIS studio session.
    const isValid =
      Boolean(userId) &&
      checkoutSession.payment_status === 'paid' &&
      metadata.type === 'studio_path' &&
      metadata.sessionId === studioSessionId &&
      checkoutSession.amount_total === 299 &&
      checkoutSession.currency === 'usd';

    if (!isValid) {
      console.error('[studio-callback] rejected checkout session', {
        sessionId,
        studioSessionId,
        type: metadata.type,
        paymentStatus: checkoutSession.payment_status,
        amountTotal: checkoutSession.amount_total,
      });
      return NextResponse.redirect(new URL('/paths/studio?error=payment_failed', request.url));
    }

    // If someone IS signed in, they must be the buyer.
    const session = await auth();
    if (session?.user?.id && session.user.id !== userId) {
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

    after(() => enrichPath(path.id, userId));

    return NextResponse.redirect(new URL(`/paths/${path.id}`, request.url));
  } catch (error) {
    console.error('Studio generate-callback error:', error);
    // Purchase record (if created) survives; user can retry from the studio page
    return NextResponse.redirect(
      new URL(`/paths/studio?error=generation_failed&studio_session=${studioSessionId}`, request.url)
    );
  }
}
