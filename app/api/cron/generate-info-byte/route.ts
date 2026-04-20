import { NextRequest, NextResponse } from 'next/server';
import { generateDailyInfoByte } from '@/lib/services/info-byte-service';
import { getAllLanguages } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const languages = await getAllLanguages();
  const results: Array<{ language: string; id: string | null; error?: string }> = [];

  for (const lang of languages) {
    try {
      const infoByte = await generateDailyInfoByte(lang.id, lang.name, lang.code);
      results.push({ language: lang.code, id: infoByte?.id ?? null });
    } catch (error) {
      console.error(`Generate info byte error for ${lang.code}:`, error);
      results.push({ language: lang.code, id: null, error: String(error) });
    }
  }

  return NextResponse.json({ success: true, results });
}
