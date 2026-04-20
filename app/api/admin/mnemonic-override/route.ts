import { NextRequest, NextResponse } from 'next/server';
import { AdminMnemonicOverrideSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Mnemonic } from '@/types/database';
import { auth } from '@/lib/auth';
import { getMnemonicById } from '@/lib/db/admin-queries';
import { insertMnemonic } from '@/lib/db/queries';

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
  const parsed = AdminMnemonicOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { mnemonicId, keywordText, sceneDescription, bridgeSentence } = parsed.data;

    // Look up existing mnemonic to get word_id
    const existing = await getMnemonicById(mnemonicId);
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Mnemonic not found' },
        { status: 404 }
      );
    }

    // Insert new mnemonic with manual data (no AI needed)
    const mnemonic = await insertMnemonic({
      wordId: existing.word_id,
      userId: null, // global mnemonic
      keywordText,
      sceneDescription,
      bridgeSentence: bridgeSentence ?? null,
      imageUrl: null, // will show gradient fallback
      isCustom: false,
    });

    return NextResponse.json<ApiResponse<Mnemonic>>({
      data: mnemonic,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to override mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
