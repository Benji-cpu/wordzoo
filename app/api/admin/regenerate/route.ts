import { NextRequest, NextResponse } from 'next/server';
import { AdminRegenerateMnemonicSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Mnemonic } from '@/types/database';
import { auth } from '@/lib/auth';
import { regenerateMnemonicFromFeedback } from '@/lib/services/mnemonic-service';
import { isAdminEmail } from '@/lib/auth/admin';
import { readJson } from '@/lib/api/request';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
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
    console.error('[app/api/admin/regenerate/route.ts]', error);
    const message = 'Failed to regenerate mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
