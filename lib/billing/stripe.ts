import Stripe from 'stripe';
import {
  getSubscriptionByUserId,
  getSubscriptionByStripeSubId,
  upsertSubscription,
  updateSubscriptionStatus,
  updateUserSubscriptionTier,
  getUserById,
  insertPurchase,
  insertStudioPathPurchase,
  getPathById,
  recordWebhookEvent,
} from '@/lib/db/queries';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const requiredPriceEnv = {
  STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  STRIPE_PRICE_YEARLY: process.env.STRIPE_PRICE_YEARLY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};

const missingEnv = Object.entries(requiredPriceEnv)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingEnv.length > 0) {
  const msg = `Missing required Stripe env vars: ${missingEnv.join(', ')}`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  } else {
    console.warn(`[billing] ${msg} — checkouts will fail until these are set.`);
  }
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS: Record<string, string> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? '',
  yearly: process.env.STRIPE_PRICE_YEARLY ?? '',
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:8000';

/** In Stripe v20+, current_period_end moved to subscription items */
function getSubscriptionPeriodEnd(sub: Stripe.Subscription): number {
  const firstItem = sub.items?.data?.[0];
  if (firstItem?.current_period_end) {
    return firstItem.current_period_end;
  }
  // Fallback: use billing_cycle_anchor + 30 days
  return sub.billing_cycle_anchor + 30 * 86400;
}

async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // Check if user already has a subscription with a customer ID
  const existing = await getSubscriptionByUserId(userId);
  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  plan: 'monthly' | 'yearly'
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId);
  const priceId = PRICE_IDS[plan];
  if (!priceId) throw new Error(`No price ID configured for plan: ${plan}`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/pricing?success=true`,
    cancel_url: `${APP_URL}/pricing?canceled=true`,
    metadata: { userId, plan },
  });

  return session.url!;
}

export async function createTravelPackCheckout(
  userId: string,
  packId: string
): Promise<string> {
  const path = await getPathById(packId);
  if (!path || path.type !== 'travel') throw new Error('Travel pack not found');

  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Travel Pack: ${path.title}`,
          description: path.description ?? undefined,
        },
        unit_amount: 499, // $4.99
      },
      quantity: 1,
    }],
    success_url: `${APP_URL}/paths?purchased=true`,
    cancel_url: `${APP_URL}/paths?canceled=true`,
    metadata: { userId, packId, type: 'travel_pack' },
  });

  return session.url!;
}

export async function createStudioPathCheckout(
  userId: string,
  sessionId: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Path Studio: Custom Learning Path',
          description: 'AI-generated dialogue path with vocabulary and conversations',
        },
        unit_amount: 299, // $2.99
      },
      quantity: 1,
    }],
    success_url: `${APP_URL}/api/studio/generate-callback?session_id={CHECKOUT_SESSION_ID}&studio_session=${sessionId}`,
    cancel_url: `${APP_URL}/paths/studio?canceled=true`,
    metadata: { userId, sessionId, type: 'studio_path' },
  });

  return session.url!;
}

export async function createPortalSession(userId: string): Promise<string> {
  const subscription = await getSubscriptionByUserId(userId);
  if (!subscription?.stripe_customer_id) {
    throw new Error('No subscription found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${APP_URL}/settings`,
  });

  return session.url;
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  // Idempotency guard: atomically claim this event. If another call already
  // recorded it, skip processing to avoid duplicate subscription/purchase rows.
  const claimed = await recordWebhookEvent(event.id, event.type);
  if (!claimed) return;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      if (session.metadata?.type === 'travel_pack') {
        // Handle travel pack purchase
        const packId = session.metadata.packId;
        if (packId && session.payment_intent) {
          await insertPurchase({
            userId,
            packId,
            stripePaymentId: typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent.id,
          });
        }
        break;
      }

      if (session.metadata?.type === 'studio_path') {
        // Record purchase atomically with payment so callback retries are safe
        // and /api/studio/generate can grant access on retry
        const studioSessionId = session.metadata.sessionId ?? null;
        const paymentIntent = session.payment_intent
          ? (typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent.id)
          : null;

        await insertStudioPathPurchase({
          userId,
          stripeSessionId: session.id,
          studioSessionId,
          stripePaymentId: paymentIntent,
        });
        break;
      }

      // Handle subscription checkout
      if (session.subscription) {
        const stripeSubId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;

        const sub = await stripe.subscriptions.retrieve(stripeSubId);
        const plan = session.metadata?.plan ?? 'monthly';
        const periodEnd = getSubscriptionPeriodEnd(sub);

        await upsertSubscription({
          userId,
          stripeCustomerId: typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? '',
          stripeSubscriptionId: stripeSubId,
          plan,
          status: sub.status === 'active' ? 'active' : 'incomplete',
          currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
        });

        await updateUserSubscriptionTier(userId, 'premium');
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const existing = await getSubscriptionByStripeSubId(sub.id);
      if (!existing) break;

      const statusMap: Record<string, string> = {
        active: 'active',
        canceled: 'canceled',
        past_due: 'past_due',
        incomplete: 'incomplete',
      };
      const mappedStatus = statusMap[sub.status] ?? 'incomplete';
      const periodEnd = getSubscriptionPeriodEnd(sub);

      await upsertSubscription({
        userId: existing.user_id,
        stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        stripeSubscriptionId: sub.id,
        plan: existing.plan,
        status: mappedStatus,
        currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
      });

      if (sub.status === 'active') {
        await updateUserSubscriptionTier(existing.user_id, 'premium');
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await updateSubscriptionStatus(sub.id, 'canceled');

      const existing = await getSubscriptionByStripeSubId(sub.id);
      if (existing) {
        await updateUserSubscriptionTier(existing.user_id, 'free');
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      // In Stripe v20+, subscription info is in parent.subscription_details
      const subDetails = invoice.parent?.subscription_details;
      if (subDetails?.subscription) {
        const subId = typeof subDetails.subscription === 'string'
          ? subDetails.subscription
          : subDetails.subscription.id;
        await updateSubscriptionStatus(subId, 'past_due');
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subDetails = invoice.parent?.subscription_details;
      if (!subDetails?.subscription) break;

      const subId = typeof subDetails.subscription === 'string'
        ? subDetails.subscription
        : subDetails.subscription.id;

      const existing = await getSubscriptionByStripeSubId(subId);
      if (!existing) break;

      // Refresh from Stripe to get the updated current_period_end after renewal
      const sub = await stripe.subscriptions.retrieve(subId);
      const periodEnd = getSubscriptionPeriodEnd(sub);

      await upsertSubscription({
        userId: existing.user_id,
        stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        stripeSubscriptionId: sub.id,
        plan: existing.plan,
        status: 'active',
        currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
      });

      await updateUserSubscriptionTier(existing.user_id, 'premium');
      break;
    }
  }
}
