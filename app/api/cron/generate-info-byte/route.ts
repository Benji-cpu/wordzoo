import { NextRequest, NextResponse } from 'next/server';
import { generateDailyInfoByte } from '@/lib/services/info-byte-service';

const INDONESIAN_LANGUAGE_ID = 'a1b2c3d4-0001-4000-8000-000000000001';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const infoByte = await generateDailyInfoByte(INDONESIAN_LANGUAGE_ID, 'Indonesian', 'id');
    return NextResponse.json({ success: true, id: infoByte?.id ?? null });
  } catch (error) {
    console.error('Generate info byte cron error:', error);
    return NextResponse.json({ error: 'Failed to generate info byte' }, { status: 500 });
  }
}
