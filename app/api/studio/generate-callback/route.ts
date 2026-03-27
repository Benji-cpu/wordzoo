import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/billing/stripe';
import { generateStudioPath } from '@/lib/services/studio-service';

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

    const path = await generateStudioPath(studioSessionId, userId);
    return NextResponse.redirect(new URL(`/paths/${path.id}`, request.url));
  } catch (error) {
    console.error('Studio generate-callback error:', error);
    return NextResponse.redirect(new URL('/paths/studio?error=generation_failed', request.url));
  }
}
