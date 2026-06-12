import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import {
  getEmailRemindersEnabled,
  setEmailRemindersEnabled,
} from '@/lib/db/email-queries';

const EmailPrefsSchema = z.object({
  emailRemindersEnabled: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const enabled = await getEmailRemindersEnabled(session.user.id);
  return NextResponse.json<ApiResponse<{ emailRemindersEnabled: boolean }>>({
    data: { emailRemindersEnabled: enabled },
    error: null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = EmailPrefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  await setEmailRemindersEnabled(session.user.id, parsed.data.emailRemindersEnabled);
  return NextResponse.json<ApiResponse<{ emailRemindersEnabled: boolean }>>({
    data: { emailRemindersEnabled: parsed.data.emailRemindersEnabled },
    error: null,
  });
}
