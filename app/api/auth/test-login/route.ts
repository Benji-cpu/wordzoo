import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { randomUUID } from 'crypto';

const TEST_USER_EMAIL = 'test@wordzoo.dev';

export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get('email');

  try {
    let userId: string;

    if (email) {
      // Look up existing user by email, or create for testing
      const existingUsers = await sql`
        SELECT id FROM users WHERE email = ${email}
      `;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id as string;
      } else {
        const newUsers = await sql`
          INSERT INTO users (id, name, email, "emailVerified", native_language, subscription_tier)
          VALUES (gen_random_uuid(), ${email.split('@')[0]}, ${email}, NOW(), 'en', 'free')
          RETURNING id
        `;
        userId = newUsers[0].id as string;
      }
    } else {
      // Default: create or find test user
      const existingUsers = await sql`
        SELECT id FROM users WHERE email = ${TEST_USER_EMAIL}
      `;

      if (existingUsers.length > 0) {
        userId = existingUsers[0].id as string;
      } else {
        const newUsers = await sql`
          INSERT INTO users (id, name, email, "emailVerified", native_language, subscription_tier)
          VALUES (gen_random_uuid(), 'Test User', ${TEST_USER_EMAIL}, NOW(), 'en', 'free')
          RETURNING id
        `;
        userId = newUsers[0].id as string;
      }
    }

    // Create a session token
    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Delete any existing sessions for this user, then create new one
    await sql`DELETE FROM sessions WHERE "userId" = ${userId}`;
    await sql`
      INSERT INTO sessions ("sessionToken", "userId", expires)
      VALUES (${sessionToken}, ${userId}, ${expires.toISOString()})
    `;

    // Redirect to dashboard with session cookie set
    const response = NextResponse.redirect(new URL('/dashboard', process.env.AUTH_URL || 'http://localhost:8000'));
    response.cookies.set('authjs.session-token', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires,
    });

    return response;
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json({ error: 'Test login failed' }, { status: 500 });
  }
}
