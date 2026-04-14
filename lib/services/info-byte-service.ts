import { getTodayInfoByte, getRecentInfoBytes, insertInfoByte } from '@/lib/db/queries';
import { generateChatJSON } from '@/lib/ai/gemini';
import { INFO_BYTE_SYSTEM_PROMPT, buildInfoBytePrompt } from '@/lib/ai/info-byte-prompts';
import type { InfoByte } from '@/types/database';

interface InfoByteGeneration {
  category: string;
  topic_summary: string;
  source_topic: string;
  easy_target: string;
  easy_english: string;
  medium_target: string;
  medium_english: string;
  hard_target: string;
  hard_english: string;
}

export async function getInfoByteForToday(languageId: string): Promise<InfoByte | null> {
  return getTodayInfoByte(languageId);
}

export async function generateDailyInfoByte(
  languageId: string,
  languageName: string,
  languageCode: string = 'id',
): Promise<InfoByte | null> {
  // Idempotency: check if already generated for today
  const existing = await getTodayInfoByte(languageId);
  if (existing) return existing;

  // Fetch recent history for diversity
  const recentHistory = await getRecentInfoBytes(languageId, 14);

  // Build prompt and generate
  const prompt = buildInfoBytePrompt(languageName, languageCode, recentHistory);

  const { data, tokensUsed } = await generateChatJSON<InfoByteGeneration>(
    [{ role: 'user', content: prompt }],
    INFO_BYTE_SYSTEM_PROMPT,
    { maxOutputTokens: 4096 },
  );

  // Validate required fields
  if (!data.category || !data.easy_target || !data.medium_target || !data.hard_target) {
    throw new Error('Info byte generation returned incomplete data');
  }

  const today = new Date().toISOString().split('T')[0];

  return insertInfoByte({
    languageId,
    publishDate: today,
    category: data.category,
    topicSummary: data.topic_summary,
    easyTarget: data.easy_target,
    easyEnglish: data.easy_english,
    mediumTarget: data.medium_target,
    mediumEnglish: data.medium_english,
    hardTarget: data.hard_target,
    hardEnglish: data.hard_english,
    sourceTopic: data.source_topic ?? null,
    tokensUsed,
  });
}
