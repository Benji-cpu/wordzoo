import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import {
  getMissingMnemonicImages,
  getMissingPhraseImages,
  getMissingSceneAnchors,
  getOrphanWords,
  type MissingMnemonicImage,
  type MissingPhraseImage,
  type MissingSceneAnchor,
  type OrphanWord,
} from '@/lib/db/admin-queries';

type MissingImagesResponse =
  | { type: 'mnemonics'; items: MissingMnemonicImage[] }
  | { type: 'phrases'; items: MissingPhraseImage[] }
  | { type: 'scenes'; items: MissingSceneAnchor[] }
  | { type: 'orphans'; items: OrphanWord[] };

const VALID_TYPES = ['mnemonics', 'phrases', 'scenes', 'orphans'] as const;

export async function GET(request: NextRequest) {
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

  const type = request.nextUrl.searchParams.get('type');
  if (!type || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: `Missing or invalid type parameter. Use: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    let result: MissingImagesResponse;

    switch (type) {
      case 'mnemonics':
        result = { type: 'mnemonics', items: await getMissingMnemonicImages() };
        break;
      case 'phrases':
        result = { type: 'phrases', items: await getMissingPhraseImages() };
        break;
      case 'scenes':
        result = { type: 'scenes', items: await getMissingSceneAnchors() };
        break;
      case 'orphans':
        result = { type: 'orphans', items: await getOrphanWords() };
        break;
      default:
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Invalid type' },
          { status: 400 }
        );
    }

    return NextResponse.json<ApiResponse<MissingImagesResponse>>({
      data: result,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch missing items';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
