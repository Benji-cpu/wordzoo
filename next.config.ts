import type { NextConfig } from "next";

// Service worker is served by the app/sw.js/route.ts handler, which sets
// its own cache-control headers. No static header rewrite needed here.
const nextConfig: NextConfig = {};

export default nextConfig;
