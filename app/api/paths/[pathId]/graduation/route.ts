import { NextRequest, NextResponse } from 'next/server';
import { PathIdParamSchema, GraduatePathSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { verifyPathAccess } from '@/lib/db';
import { checkGraduation, completeGraduation } from '@/lib/services/graduation-service';
import type { GraduationData, GraduationResult } from '@/lib/services/graduation-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pathId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { pathId } = await params;
  const parsed = PathIdParamSchema.safeParse({ pathId });
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid pathId parameter' },
      { status: 400 }
    );
  }

  const hasAccess = await verifyPathAccess(parsed.data.pathId, session.user.id);
  if (!hasAccess) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Path not found' },
      { status: 404 }
    );
  }

  try {
    const graduation = await checkGraduation(session.user.id, parsed.data.pathId);
    return NextResponse.json<ApiResponse<GraduationData>>({
      data: graduation,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check graduation';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pathId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { pathId } = await params;
  const paramsParsed = PathIdParamSchema.safeParse({ pathId });
  if (!paramsParsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid pathId parameter' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const bodyParsed = GraduatePathSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const hasAccess = await verifyPathAccess(paramsParsed.data.pathId, session.user.id);
  if (!hasAccess) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Path not found' },
      { status: 404 }
    );
  }

  try {
    const result = await completeGraduation(
      session.user.id,
      paramsParsed.data.pathId,
      bodyParsed.data.quizScore
    );
    return NextResponse.json<ApiResponse<GraduationResult>>({
      data: result,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete graduation';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
