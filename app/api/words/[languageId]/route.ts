import { NextRequest, NextResponse } from 'next/server';
import { LanguageIdParamSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Word } from '@/types/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ languageId: string }> }
) {
  const { languageId } = await params;
  const parsed = LanguageIdParamSchema.safeParse({ languageId });
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid languageId parameter' },
      { status: 400 }
    );
  }

  return NextResponse.json<ApiResponse<Word[]>>(
    { data: null, error: 'Not implemented' },
    { status: 501 }
  );
}
