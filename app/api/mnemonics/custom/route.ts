import { NextRequest, NextResponse } from 'next/server';
import { CustomMnemonicSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Mnemonic } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`mnemonics:custom:${ip}`);
  if (!allowed) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = CustomMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  return NextResponse.json<ApiResponse<Mnemonic>>(
    { data: null, error: 'Not implemented' },
    { status: 501 }
  );
}
