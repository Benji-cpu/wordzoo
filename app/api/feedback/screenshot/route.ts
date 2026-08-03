import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { guardSpend } from '@/lib/spend-guard';
import type { ApiResponse } from '@/types/api';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

// Blobs here are served publicly, so the stored content type must come from an
// allowlist, never from the client. Otherwise this is an arbitrary-content
// host on our own domain.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  const guard = await guardSpend('screenshot_upload');
  if (!guard.ok) return guard.response;

  try {
    const formData = await request.formData();
    const file = formData.get('screenshot') as File | null;
    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No screenshot file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Screenshot exceeds 2MB limit' },
        { status: 400 }
      );
    }

    const contentType = ALLOWED_TYPES.has(file.type) ? file.type : 'image/jpeg';
    const blob = await put(`feedback/${guard.userId}/${Date.now()}.jpg`, file, {
      access: 'public',
      contentType,
    });

    return NextResponse.json<ApiResponse<{ url: string }>>({
      data: { url: blob.url },
      error: null,
    });
  } catch (error) {
    console.error('[app/api/feedback/screenshot/route.ts]', error);
    const message = 'Failed to upload screenshot';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
