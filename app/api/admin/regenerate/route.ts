import { NextRequest, NextResponse } from 'next/server';
import { AdminRegenerateMnemonicSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Mnemonic } from '@/types/database';
import { auth } from '@/lib/auth';
import { regenerateMnemonicFromFeedback } from '@/lib/services/mnemonic-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  if (!adminEmails.includes(session.user.email!)) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = AdminRegenerateMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { mnemonicId } = parsed.data;

    const mnemonic = await regenerateMnemonicFromFeedback(mnemonicId);

    return NextResponse.json<ApiResponse<Mnemonic>>({
      data: mnemonic,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
