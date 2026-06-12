import { NextRequest, NextResponse } from 'next/server';
import { recordReferralClick } from '@/lib/db/public-queries';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Public invite link: /invite/<referrerId>. Records the click, drops the
 * same wz_ref cookie as the word share page, and lands the visitor on the
 * no-signup demo.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ referrerId: string }> }
) {
  const { referrerId } = await params;
  const tryUrl = new URL('/try', request.url);

  if (!UUID_RE.test(referrerId)) {
    return NextResponse.redirect(tryUrl);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  try {
    await recordReferralClick(referrerId, ip);
  } catch {
    // Unknown referrer or DB hiccup — never block the visitor.
  }

  const response = NextResponse.redirect(tryUrl);
  response.cookies.set('wz_ref', referrerId, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
    sameSite: 'lax',
  });
  return response;
}
