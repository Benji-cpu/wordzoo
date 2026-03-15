import { NextRequest, NextResponse } from 'next/server';
import { WordIdParamSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { WordWithMnemonic } from '@/types/audio';
import { sql } from '@/lib/db/client';
import { auth } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ wordId: string }> }
) {
  const { wordId } = await params;
  const parsed = WordIdParamSchema.safeParse({ wordId });
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid wordId parameter' },
      { status: 400 }
    );
  }

  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const wordRows = await sql`
      SELECT w.id, w.text, w.romanization, w.pronunciation_audio_url, w.meaning_en,
             l.code AS language_code
      FROM words w
      JOIN languages l ON l.id = w.language_id
      WHERE w.id = ${parsed.data.wordId}
    `;

    if (wordRows.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Word not found' },
        { status: 404 }
      );
    }

    const word = wordRows[0];

    let mnemonic = null;
    const mnemonicRows = await sql`
      SELECT keyword_text, scene_description, audio_url
      FROM mnemonics
      WHERE word_id = ${parsed.data.wordId}
        AND (user_id = ${userId} OR user_id IS NULL)
      ORDER BY
        CASE WHEN user_id = ${userId} THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 1
    `;

    if (mnemonicRows.length > 0) {
      mnemonic = mnemonicRows[0] as {
        keyword_text: string;
        scene_description: string;
        audio_url: string | null;
      };
    }

    const result: WordWithMnemonic = {
      id: word.id as string,
      text: word.text as string,
      romanization: word.romanization as string | null,
      pronunciation_audio_url: word.pronunciation_audio_url as string | null,
      meaning_en: word.meaning_en as string,
      language_code: word.language_code as WordWithMnemonic['language_code'],
      mnemonic,
    };

    return NextResponse.json<ApiResponse<WordWithMnemonic>>({
      data: result,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
