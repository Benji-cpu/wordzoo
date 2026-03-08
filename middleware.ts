import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow auth API routes through
  if (pathname.startsWith('/api/auth')) {
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
