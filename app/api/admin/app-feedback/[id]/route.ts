import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UpdateAppFeedbackSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { AppFeedback } from '@/types/database';
import { updateAppFeedbackStatus } from '@/lib/db/admin-queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const parsed = UpdateAppFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const updated = await updateAppFeedbackStatus(id, parsed.data.status, parsed.data.adminNotes);
    if (!updated) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<AppFeedback>>({
      data: updated,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update feedback';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
