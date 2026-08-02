import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleWebhookEvent } from '@/lib/billing/stripe';
import { releaseWebhookEvent } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await handleWebhookEvent(event);
  } catch (err) {
    // handleWebhookEvent claims the event id for idempotency BEFORE doing any
    // work, so swallowing the error and returning 200 (the old behaviour)
    // marked a failed event as permanently processed — a transient DB blip
    // during checkout.session.completed meant the customer paid and never got
    // premium, forever, with no retry and no alert.
    //
    // Release the claim and return 500 so Stripe retries on its own schedule.
    console.error('Webhook handler error:', err);
    await releaseWebhookEvent(event.id).catch((releaseErr) => {
      console.error('Failed to release webhook claim:', releaseErr);
    });
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
