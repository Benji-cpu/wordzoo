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

  // For unauthenticated requests:
  if (!req.auth) {
    // API routes → return 401 JSON
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Page routes → redirect to login
    const loginUrl = new URL('/login', req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/paths/:path*',
    '/learn/:path*',
    '/review/:path*',
    '/tutor/:path*',
    '/settings/:path*',
    '/gallery/:path*',
    '/admin/:path*',
    '/community/:path*',
  ],
};
