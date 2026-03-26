import { generateChat } from '@/lib/ai/gemini';
import { recordReview } from '@/lib/srs/engine';
import {
  getOrCreateUserWord,
  getWordsByTexts,
  insertTutorWordReviews,
} from '@/lib/db';
import type { KnownWordRow } from '@/lib/db/queries';
import type { TutorMessage } from '@/types/database';

interface WordUsageEntry {
  wordId: string;
  text: string;
  usageType: 'correct' | 'corrected' | 'introduced' | 'missed';
}

export interface SessionWordUsage {
  correct: WordUsageEntry[];
  corrected: WordUsageEntry[];
  introduced: WordUsageEntry[];
  missed: WordUsageEntry[];
}

export async function analyzeSessionWordUsage(
  messages: TutorMessage[],
  knownWords: KnownWordRow[],
  dueWords: KnownWordRow[],
  languageId: string
): Promise<SessionWordUsage> {
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n');

  // Build word list with IDs for the AI to reference
  const allWords = new Map<string, { wordId: string; text: string }>();
  for (const w of [...knownWords, ...dueWords]) {
    allWords.set(w.word_id, { wordId: w.word_id, text: w.text });
  }

  if (allWords.size === 0) {
    return { correct: [], corrected: [], introduced: [], missed: [] };
  }

  const wordListStr = Array.from(allWords.values())
    .map((w) => `${w.wordId}: ${w.text}`)
    .join('\n');

  const dueWordIds = new Set(dueWords.map((w) => w.word_id));

  const prompt = `Analyze this language tutoring conversation and classify how the student used each vocabulary word.

Known vocabulary (id: word):
${wordListStr}

Transcript:
${transcript}

For each word from the vocabulary list that appeared in the conversation, classify it as:
- "correct": student used the word correctly
- "corrected": student used the word but was corrected by the tutor
- "missed": word was due for review but the student didn't use it (only for these IDs: ${Array.from(dueWordIds).join(', ')})

Also identify up to 5 new words the tutor introduced that are NOT in the vocabulary list above. List them as "introduced" with just the word text (no ID).

Return ONLY a JSON object:
{
  "correct": ["wordId1", "wordId2"],
  "corrected": ["wordId3"],
  "missed": ["wordId4"],
  "introduced": ["new_word_1", "new_word_2"]
}`;

  try {
    const response = await generateChat(
      [{ role: 'user', content: prompt }],
      'You are a language learning analyst. Return only valid JSON.'
    );

    const cleaned = response.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned) as {
      correct?: string[];
      corrected?: string[];
      missed?: string[];
      introduced?: string[];
    };

    const usage: SessionWordUsage = {
      correct: [],
      corrected: [],
      introduced: [],
      missed: [],
    };

    // Validate wordIds for correct/corrected/missed
    for (const id of result.correct ?? []) {
      const word = allWords.get(id);
      if (word) usage.correct.push({ wordId: id, text: word.text, usageType: 'correct' });
    }
    for (const id of result.corrected ?? []) {
      const word = allWords.get(id);
      if (word) usage.corrected.push({ wordId: id, text: word.text, usageType: 'corrected' });
    }
    for (const id of result.missed ?? []) {
      const word = allWords.get(id);
      if (word && dueWordIds.has(id)) usage.missed.push({ wordId: id, text: word.text, usageType: 'missed' });
    }

    // Look up introduced words by text
    const introducedTexts = (result.introduced ?? []).slice(0, 5);
    if (introducedTexts.length > 0) {
      const foundWords = await getWordsByTexts(introducedTexts, languageId);
      for (const w of foundWords) {
        usage.introduced.push({ wordId: w.id, text: w.text, usageType: 'introduced' });
      }
    }

    return usage;
  } catch (error) {
    console.error('[tutor-srs-bridge] Failed to analyze session word usage:', error);
    return { correct: [], corrected: [], introduced: [], missed: [] };
  }
}

export async function recordConversationReviews(
  userId: string,
  sessionId: string,
  languageId: string,
  wordUsage: SessionWordUsage
): Promise<{ reviewsRecorded: number; wordsIntroduced: number; accuracyRate: number }> {
  let reviewsRecorded = 0;
  let wordsIntroduced = 0;

  const tutorWordReviews: { sessionId: string; userId: string; wordId: string; languageId: string; usageType: string; srsQuality: number | null }[] = [];

  // Correct usage → SRS quality 4 (got_it)
  for (const entry of wordUsage.correct) {
    try {
      await recordReview(userId, entry.wordId, 'production', 'got_it');
      reviewsRecorded++;
      tutorWordReviews.push({ sessionId, userId, wordId: entry.wordId, languageId, usageType: 'correct', srsQuality: 4 });
    } catch (error) {
      console.error(`[tutor-srs-bridge] Failed to record correct review for ${entry.wordId}:`, error);
    }
  }

  // Corrected usage → SRS quality 3 (hard)
  for (const entry of wordUsage.corrected) {
    try {
      await recordReview(userId, entry.wordId, 'production', 'hard');
      reviewsRecorded++;
      tutorWordReviews.push({ sessionId, userId, wordId: entry.wordId, languageId, usageType: 'corrected', srsQuality: 3 });
    } catch (error) {
      console.error(`[tutor-srs-bridge] Failed to record corrected review for ${entry.wordId}:`, error);
    }
  }

  // Introduced words → create user_word (no SRS update)
  for (const entry of wordUsage.introduced) {
    try {
      await getOrCreateUserWord(userId, entry.wordId, null);
      wordsIntroduced++;
      tutorWordReviews.push({ sessionId, userId, wordId: entry.wordId, languageId, usageType: 'introduced', srsQuality: null });
    } catch (error) {
      console.error(`[tutor-srs-bridge] Failed to introduce word ${entry.wordId}:`, error);
    }
  }

  // Missed words → no SRS update, just track
  for (const entry of wordUsage.missed) {
    tutorWordReviews.push({ sessionId, userId, wordId: entry.wordId, languageId, usageType: 'missed', srsQuality: null });
  }

  // Batch insert tracking records
  try {
    await insertTutorWordReviews(tutorWordReviews);
  } catch (error) {
    console.error('[tutor-srs-bridge] Failed to insert tutor word reviews:', error);
  }

  const totalAttempted = wordUsage.correct.length + wordUsage.corrected.length;
  const accuracyRate = totalAttempted > 0
    ? Math.round((wordUsage.correct.length / totalAttempted) * 100)
    : 0;

  return { reviewsRecorded, wordsIntroduced, accuracyRate };
}
