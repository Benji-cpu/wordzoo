import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { exportUserData } from '@/lib/services/user-export-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const data = await exportUserData(session.user.id);
  const filename = `wordzoo-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
