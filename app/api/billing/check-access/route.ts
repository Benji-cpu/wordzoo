import { NextRequest, NextResponse } from 'next/server';
import { CheckAccessSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/services/billing-service';
import { readJson } from '@/lib/api/request';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = CheckAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const result = await checkAccess(session.user.id, parsed.data.feature);
    return NextResponse.json<ApiResponse<typeof result>>({
      data: result,
      error: null,
    });
  } catch (error) {
    console.error('[app/api/billing/check-access/route.ts]', error);
    const message = 'Failed to check access';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
