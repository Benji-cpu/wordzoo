import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';
import type { ApiResponse } from '@/types/api';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

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

    const blob = await put(`feedback/${session.user.id}/${Date.now()}.jpg`, file, {
      access: 'public',
      contentType: file.type || 'image/jpeg',
    });

    return NextResponse.json<ApiResponse<{ url: string }>>({
      data: { url: blob.url },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload screenshot';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
