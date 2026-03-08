import { NextRequest, NextResponse } from 'next/server';
import { CustomPathSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Path } from '@/types/database';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CustomPathSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  return NextResponse.json<ApiResponse<Path>>(
    { data: null, error: 'Not implemented' },
    { status: 501 }
  );
}
