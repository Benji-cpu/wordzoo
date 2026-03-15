import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { AdoptMnemonicSchema } from '@/types/api';
import { auth } from '@/lib/auth';
import { adoptMnemonic } from '@/lib/services/community-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = AdoptMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    await adoptMnemonic(session.user.id, parsed.data.wordId, parsed.data.mnemonicId);
    return NextResponse.json<ApiResponse<{ adopted: boolean }>>({
      data: { adopted: true },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to adopt mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 400 }
    );
  }
}
