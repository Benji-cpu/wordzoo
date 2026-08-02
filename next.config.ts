import type { NextConfig } from "next";

// Service worker is served by the app/sw.js/route.ts handler, which sets
// its own cache-control headers. No static header rewrite needed here.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            // Microphone stays enabled — speaking practice and the tutor's
            // voice input both need it.
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), payment=(), microphone=(self)',
          },
          {
            // Report-only on purpose. Next's inline bootstrap, framer-motion,
            // Stripe.js and the Blob image origin will all trip a strict
            // policy, and an enforcing CSP shipped blind is the fastest way to
            // white-screen production. Promote to Content-Security-Policy only
            // after the reports come back clean.
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://lh3.googleusercontent.com",
              "media-src 'self' data: https://*.public.blob.vercel-storage.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.neon.tech https://api.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
