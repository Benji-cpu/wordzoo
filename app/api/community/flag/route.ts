import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { FlagMnemonicSchema } from '@/types/api';
import { auth } from '@/lib/auth';
import { flagMnemonicContent } from '@/lib/services/community-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = FlagMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    await flagMnemonicContent(
      session.user.id,
      parsed.data.mnemonicId,
      parsed.data.reason,
      parsed.data.detail
    );
    return NextResponse.json<ApiResponse<{ flagged: boolean }>>({
      data: { flagged: true },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to flag content';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 400 }
    );
  }
}
