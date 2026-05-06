import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SetTripSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { getTripContext, setTrip, clearTrip, type TripContext } from '@/lib/services/trip-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Authentication required' }, { status: 401 });
  }
  const ctx = await getTripContext(session.user.id);
  return NextResponse.json<ApiResponse<TripContext>>({ data: ctx, error: null });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Authentication required' }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = SetTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    );
  }
  const ctx = await setTrip(session.user.id, parsed.data);
  return NextResponse.json<ApiResponse<TripContext>>({ data: ctx, error: null });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Authentication required' }, { status: 401 });
  }
  await clearTrip(session.user.id);
  return NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true }, error: null });
}
