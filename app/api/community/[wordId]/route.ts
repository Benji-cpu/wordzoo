import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { CommunityListQuerySchema, SubmitCommunityMnemonicSchema } from '@/types/api';
import { auth } from '@/lib/auth';
import {
  getCommunityMnemonicsForWord,
  getCommunityCountForWord,
} from '@/lib/db/community-queries';
import { submitMnemonicToCommunity } from '@/lib/services/community-service';
import type { CommunityMnemonicCard } from '@/types/community';

const PAGE_SIZE = 20;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wordId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { wordId } = await params;
  const { searchParams } = request.nextUrl;

  const parsed = CommunityListQuerySchema.safeParse({
    sort: searchParams.get('sort') ?? undefined,
    page: searchParams.get('page') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  const { sort, page } = parsed.data;
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const [items, total] = await Promise.all([
      getCommunityMnemonicsForWord(wordId, session.user.id, sort, PAGE_SIZE, offset),
      getCommunityCountForWord(wordId),
    ]);

    return NextResponse.json<ApiResponse<{
      items: CommunityMnemonicCard[];
      total: number;
      page: number;
      hasMore: boolean;
    }>>({
      data: {
        items,
        total,
        page,
        hasMore: offset + items.length < total,
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch community mnemonics';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = SubmitCommunityMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const result = await submitMnemonicToCommunity(parsed.data.mnemonicId, session.user.id);
    return NextResponse.json<ApiResponse<{ status: string }>>({
      data: { status: result.status },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 400 }
    );
  }
}
