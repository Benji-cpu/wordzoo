import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { VoteMnemonicSchema } from '@/types/api';
import { auth } from '@/lib/auth';
import { voteOnMnemonic } from '@/lib/services/community-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = VoteMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const result = await voteOnMnemonic(session.user.id, parsed.data.mnemonicId);
    return NextResponse.json<ApiResponse<{ voted: boolean; newCount: number }>>({
      data: result,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to vote';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 400 }
    );
  }
}
