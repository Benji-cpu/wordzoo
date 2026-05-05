import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { Pool } from '@neondatabase/serverless';
import NeonAdapter from '@auth/neon-adapter';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: NeonAdapter(pool),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
    newUser: '/signup',
    error: '/login',
  },
  session: {
    strategy: 'database',
    // Persist mobile sessions for 60 days. The cookie maxAge mirrors the
    // session row's expiry, so users stop having to log in every visit.
    maxAge: 60 * 24 * 60 * 60, // 60 days
    updateAge: 24 * 60 * 60, // refresh expiry on activity once per day
  },
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
