'use server';

import { auth } from '@/lib/auth';
import { sql } from '@/lib/db/client';

interface OnboardingImportData {
  languageCode: string;
  words: Array<{
    text: string;
    romanization?: string;
    meaningEn: string;
    partOfSpeech: string;
    keyword: string;
    sceneDescription: string;
  }>;
}

export async function importOnboardingProgress(data: OnboardingImportData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const userId = session.user.id;
  const langCode = data.languageCode;

  // Find the language
  const languages = await sql`
    SELECT id FROM languages WHERE code = ${langCode}
  `;

  if (languages.length === 0) {
    throw new Error(`Language not found: ${langCode}`);
  }

  const languageId = languages[0].id as string;

  for (const word of data.words) {
    // Find or create the word
    const existingWords = await sql`
      SELECT id FROM words WHERE language_id = ${languageId} AND text = ${word.text}
    `;

    let wordId: string;

    if (existingWords.length > 0) {
      wordId = existingWords[0].id as string;
    } else {
      const romanization = word.romanization || null;
      const inserted = await sql`
        INSERT INTO words (language_id, text, romanization, meaning_en, part_of_speech, frequency_rank)
        VALUES (${languageId}, ${word.text}, ${romanization}, ${word.meaningEn}, ${word.partOfSpeech}, ${0})
        RETURNING id
      `;
      wordId = inserted[0].id as string;
    }

    // Insert mnemonic (idempotent via unique check)
    const existingMnemonics = await sql`
      SELECT id FROM mnemonics WHERE word_id = ${wordId} AND user_id = ${userId} AND keyword_text = ${word.keyword}
    `;

    if (existingMnemonics.length === 0) {
      await sql`
        INSERT INTO mnemonics (word_id, user_id, keyword_text, scene_description, is_custom)
        VALUES (${wordId}, ${userId}, ${word.keyword}, ${word.sceneDescription}, ${false})
      `;
    }

    // Insert user_word tracking (idempotent via unique constraint)
    const existingUserWords = await sql`
      SELECT id FROM user_words WHERE user_id = ${userId} AND word_id = ${wordId}
    `;

    if (existingUserWords.length === 0) {
      await sql`
        INSERT INTO user_words (user_id, word_id, status, ease_factor, interval_days, next_review_at)
        VALUES (${userId}, ${wordId}, ${'learning'}, ${2.5}, ${1}, NOW() + INTERVAL '1 day')
      `;
    }
  }

  return { success: true, wordsImported: data.words.length };
}

export async function claimReferral(referrerId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  // Guard against self-referral
  if (referrerId === session.user.id) {
    return { success: false, reason: 'self-referral' };
  }

  const { attributeReferralSignup } = await import('@/lib/db/community-queries');
  const result = await attributeReferralSignup(referrerId, session.user.id);
  return { success: !!result };
}
