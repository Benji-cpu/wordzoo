import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow auth API routes through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow share routes through (for social crawlers)
  if (pathname.startsWith('/api/share')) {
    return NextResponse.next();
  }

  // Allow Stripe webhook (verified by Stripe signature, not session)
  if (pathname === '/api/billing/webhook') {
    return NextResponse.next();
  }

  // Allow cron routes (verified by CRON_SECRET bearer token)
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  // Protect all other API routes
  if (pathname.startsWith('/api') && !req.auth) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/api/:path*'],
};
