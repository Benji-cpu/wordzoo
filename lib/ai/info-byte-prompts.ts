import type { RecentInfoByteRow } from '@/lib/db/queries';

export const INFO_BYTE_SYSTEM_PROMPT = `You are a language learning content generator. You create short, engaging topical snippets written in a target language with English translations at three difficulty levels. Your content connects language learning to real-world topics — pop culture, science, world events, cultural insights, and more.

OUTPUT FORMAT:
Return ONLY a valid JSON object. No markdown, no explanation, no code fences.
Fields:
- "category": string (one of: science, culture, world_events, pop_culture, technology, nature, history, food_cuisine, sports, arts_entertainment)
- "topic_summary": string (1-sentence English summary of the topic)
- "source_topic": string (the real-world topic or event that inspired this content)
- "easy_target": string (1-2 sentences in target language, A1 vocabulary, simple grammar, ~20 words)
- "easy_english": string (English translation of easy_target)
- "medium_target": string (2 short paragraphs in target language, A2 vocabulary, compound sentences, ~50 words)
- "medium_english": string (English translation of medium_target)
- "hard_target": string (3-4 paragraphs in target language, B1 vocabulary, varied tenses, ~100 words)
- "hard_english": string (English translation of hard_target)

CONTENT RULES:
- All target language text must be grammatically correct and natural-sounding
- Easy level uses only basic vocabulary and present tense
- Medium level introduces compound sentences and common conjunctions
- Hard level uses varied tenses, subordinate clauses, and more nuanced vocabulary
- Content should be interesting, educational, and culturally sensitive
- Avoid controversial political topics or anything inappropriate for learners
- Each difficulty level tells the same story/fact but with increasing detail and complexity`;

const CATEGORIES = [
  'science', 'culture', 'world_events', 'pop_culture', 'technology',
  'nature', 'history', 'food_cuisine', 'sports', 'arts_entertainment',
] as const;

export function buildInfoBytePrompt(
  languageName: string,
  languageCode: string,
  recentHistory: RecentInfoByteRow[],
): string {
  const historyBlock = recentHistory.length > 0
    ? `\nRecent topics (DO NOT repeat or cover semantically similar topics):\n${recentHistory.map(h => `- ${h.publish_date}: [${h.category}] ${h.topic_summary}`).join('\n')}\n`
    : '\nNo recent history — pick any category.\n';

  const recentCategories = recentHistory.slice(0, 5).map(h => h.category);
  const availableCategories = CATEGORIES.filter(c => !recentCategories.includes(c));
  const categoryHint = availableCategories.length > 0
    ? `Preferred categories (not used in last 5 days): ${availableCategories.join(', ')}`
    : `All categories used recently — pick the least recent one.`;

  return `Generate a daily "Info Byte" for ${languageName} (${languageCode}) learners.

${categoryHint}
${historyBlock}
Requirements:
- Pick a specific, interesting real-world topic (a recent discovery, cultural tradition, fun fact, trending topic, etc.)
- Write content at three difficulty levels in ${languageName}
- Easy: 1-2 simple sentences (~20 words in ${languageName}), A1 level
- Medium: 2 short paragraphs (~50 words in ${languageName}), A2 level
- Hard: 3-4 paragraphs (~100 words in ${languageName}), B1 level
- Each level covers the same topic with increasing depth and language complexity
- Make it genuinely interesting — something a learner would want to read

Return ONLY the JSON object.`;
}
