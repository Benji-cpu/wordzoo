import {
  getOrCreateLearnerProfile,
  updateLearnerProfile,
  getWeakWords,
  getTutorMessages,
  getTutorSessionById,
} from '@/lib/db';
import { generateChat } from '@/lib/ai/gemini';
import type { LearnerProfile } from '@/types/database';
import type { KnownWordRow } from '@/lib/db/queries';

export type ProficiencyTier = 'beginner' | 'intermediate' | 'advanced';

export function getProficiencyTier(estimate: string): ProficiencyTier {
  switch (estimate) {
    case 'beginner':
    case 'elementary':
      return 'beginner';
    case 'intermediate':
      return 'intermediate';
    case 'upper_intermediate':
    case 'advanced':
      return 'advanced';
    default:
      return 'beginner';
  }
}

export async function getOrCreateProfile(
  userId: string,
  languageId: string
): Promise<LearnerProfile> {
  return getOrCreateLearnerProfile(userId, languageId);
}

export async function buildAdaptiveContext(
  userId: string,
  languageId: string
): Promise<{ contextString: string; proficiencyTier: ProficiencyTier }> {
  const profile = await getOrCreateLearnerProfile(userId, languageId);
  const weakWords = await getWeakWords(userId, languageId, 2.0);
  const proficiencyTier = getProficiencyTier(profile.proficiency_estimate);

  const blocks: string[] = [];

  if (profile.proficiency_estimate !== 'beginner' || profile.session_count > 0) {
    blocks.push(`Proficiency: ${profile.proficiency_estimate} (${profile.session_count} sessions, ${profile.total_messages} messages)`);
  }

  if (Array.isArray(profile.weakness_patterns) && profile.weakness_patterns.length > 0) {
    blocks.push(`Known weaknesses: ${profile.weakness_patterns.slice(0, 5).join(', ')}`);
  }

  if (Array.isArray(profile.topics_covered) && profile.topics_covered.length > 0) {
    blocks.push(`Topics covered: ${profile.topics_covered.slice(0, 10).join(', ')}`);
  }

  if (weakWords.length > 0) {
    const weakList = weakWords
      .slice(0, 10)
      .map((w: KnownWordRow) => `${w.text} (${w.meaning_en})`)
      .join(', ');
    blocks.push(`Weak SRS words (low ease factor, need extra practice): ${weakList}`);
  }

  return {
    contextString: blocks.length === 0 ? '' : blocks.join('\n'),
    proficiencyTier,
  };
}

export async function getWeaknessReport(
  userId: string,
  languageId: string
): Promise<{
  weakWords: KnownWordRow[];
  weaknessPatterns: string[];
  correctionHistory: Record<string, unknown>;
  proficiencyEstimate: string;
  sessionCount: number;
}> {
  const [profile, weakWords] = await Promise.all([
    getOrCreateLearnerProfile(userId, languageId),
    getWeakWords(userId, languageId, 2.0),
  ]);

  return {
    weakWords,
    weaknessPatterns: Array.isArray(profile.weakness_patterns) ? profile.weakness_patterns : [],
    correctionHistory: typeof profile.correction_history === 'object' && profile.correction_history ? profile.correction_history : {},
    proficiencyEstimate: profile.proficiency_estimate,
    sessionCount: profile.session_count,
  };
}

export async function updateFromSession(
  userId: string,
  sessionId: string
): Promise<void> {
  try {
    const session = await getTutorSessionById(sessionId);
    if (!session) return;

    const messages = await getTutorMessages(sessionId, 1000);
    if (messages.length === 0) return;

    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
      .join('\n');

    const analysisPrompt = `Analyze this language tutoring conversation transcript and return a JSON object with exactly these fields:
{
  "weaknesses": ["list of specific grammar/vocabulary weaknesses observed, max 5"],
  "topics": ["list of topics/themes discussed, max 5"],
  "corrections": {"word_or_pattern": "correction_note", ...max 5 entries},
  "proficiency_estimate": "one of: beginner, elementary, intermediate, upper_intermediate, advanced",
  "session_highlight": "one sentence summary of the session"
}

Transcript:
${transcript}

Return ONLY the JSON object, no other text.`;

    const response = await generateChat(
      [{ role: 'user', content: analysisPrompt }],
      'You are a language learning analyst. Return only valid JSON.'
    );

    let analysis: {
      weaknesses?: string[];
      topics?: string[];
      corrections?: Record<string, string>;
      proficiency_estimate?: string;
      session_highlight?: string;
    };

    try {
      const cleaned = response.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      console.error(`[learner-profile] Failed to parse analysis JSON for session ${sessionId}`);
      return;
    }

    const profile = await getOrCreateLearnerProfile(userId, session.language_id);

    // Merge weaknesses (cap at 20)
    const existingWeaknesses = Array.isArray(profile.weakness_patterns) ? profile.weakness_patterns : [];
    const newWeaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
    const mergedWeaknesses = [...new Set([...newWeaknesses, ...existingWeaknesses])].slice(0, 20);

    // Merge topics (cap at 30)
    const existingTopics = Array.isArray(profile.topics_covered) ? profile.topics_covered : [];
    const newTopics = Array.isArray(analysis.topics) ? analysis.topics : [];
    const mergedTopics = [...new Set([...newTopics, ...existingTopics])].slice(0, 30);

    // Merge corrections (cap at 50 keys)
    const existingCorrections = typeof profile.correction_history === 'object' && profile.correction_history ? profile.correction_history : {};
    const newCorrections = typeof analysis.corrections === 'object' && analysis.corrections ? analysis.corrections : {};
    const mergedCorrections = { ...existingCorrections, ...newCorrections };
    const correctionKeys = Object.keys(mergedCorrections);
    if (correctionKeys.length > 50) {
      for (const key of correctionKeys.slice(50)) {
        delete mergedCorrections[key];
      }
    }

    // Update session summaries (cap at 5)
    const existingSummaries = Array.isArray(profile.recent_session_summaries) ? profile.recent_session_summaries : [];
    const newSummary = {
      sessionId,
      date: new Date().toISOString(),
      highlight: analysis.session_highlight ?? '',
      mode: session.mode,
    };
    const mergedSummaries = [newSummary, ...existingSummaries].slice(0, 5);

    const userMessages = messages.filter((m) => m.role === 'user');
    const startedAt = new Date(session.started_at);
    const durationMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000);

    const validProficiencies = ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced'];
    const proficiency = validProficiencies.includes(analysis.proficiency_estimate ?? '')
      ? analysis.proficiency_estimate!
      : undefined;

    await updateLearnerProfile(userId, session.language_id, {
      weaknessPatterns: mergedWeaknesses,
      topicsCovered: mergedTopics,
      correctionHistory: mergedCorrections,
      proficiencyEstimate: proficiency,
      sessionCountIncrement: 1,
      messagesIncrement: userMessages.length,
      minutesIncrement: durationMinutes,
      recentSessionSummaries: mergedSummaries,
    });
  } catch (error) {
    console.error(`[learner-profile] Failed to update from session ${sessionId}:`, error);
  }
}
