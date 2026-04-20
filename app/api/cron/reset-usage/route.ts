import { NextRequest, NextResponse } from 'next/server';
import { resetDailyLimits } from '@/lib/services/billing-service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await resetDailyLimits();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset daily usage cron error:', error);
    return NextResponse.json({ error: 'Failed to reset usage' }, { status: 500 });
  }
}
