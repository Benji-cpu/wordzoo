import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Build ID — changes per deploy. Falls back to a timestamp in dev so reloads
// during development are straightforward.
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ??
  process.env.NEXT_PUBLIC_BUILD_ID ??
  String(Date.now());

let cachedTemplate: string | null = null;

async function loadTemplate(): Promise<string> {
  if (cachedTemplate) return cachedTemplate;
  const templatePath = path.join(process.cwd(), 'lib', 'offline', 'sw-template.js');
  cachedTemplate = await readFile(templatePath, 'utf8');
  return cachedTemplate;
}

export async function GET() {
  const template = await loadTemplate();
  const body = template.replace('__CACHE_NAME__', `wordzoo-${BUILD_ID}`);

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
