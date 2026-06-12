import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDueWords, getDuePhrases } from '@/lib/srs/engine';
import { getAllLearnedWordsForPractice, getWordFamilies, getUserActivePath, getLanguageById, getDueCountsByOtherLanguages } from '@/lib/db/queries';
import { getPhraseWordsWithMnemonics } from '@/lib/db/scene-flow-queries';
import { getInsightState } from '@/lib/db/insight-queries';
import { getUserProfile } from '@/lib/db/queries';
import {
  personalizeReviewPhrase,
  personalizeEn,
  isPersonalizableLanguage,
  firstNameOf,
  type LearnerGender,
} from '@/lib/learn/personalize';
import { ReviewClient } from '@/components/learn/ReviewClient';
import type { LearnWordFamily } from '@/types/learn';
import type { PhraseWordMnemonic } from '@/types/database';

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Scope review to the user's active path's language so they aren't reviewing
  // words from a path they're not currently working on. If no active path,
  // fall back to all-language review.
  const activePath = await getUserActivePath(session.user.id);
  const languageId = activePath?.path_language_id ?? null;

  const [dueWords, rawDuePhrases, practiceWords, insightState, language, otherLanguagesDue, profile] = await Promise.all([
    getDueWords(session.user.id, undefined, undefined, languageId),
    getDuePhrases(session.user.id, undefined, languageId),
    getAllLearnedWordsForPractice(session.user.id, undefined, languageId),
    getInsightState(session.user.id),
    languageId ? getLanguageById(languageId) : Promise.resolve(null),
    getDueCountsByOtherLanguages(session.user.id, languageId),
    getUserProfile(session.user.id),
  ]);

  // Personalize learner-facing phrase fields (same rules as the learn page —
  // the due queue otherwise still shows the seed persona "Ana").
  const prefs = (profile?.preferences ?? {}) as Record<string, unknown>;
  const learnerIdentity = {
    firstName:
      (typeof prefs.learner_name === 'string' && prefs.learner_name.trim()
        ? prefs.learner_name.trim()
        : firstNameOf(profile?.name)) ?? null,
    gender:
      prefs.learner_gender === 'male' || prefs.learner_gender === 'female'
        ? (prefs.learner_gender as LearnerGender)
        : null,
  };
  const duePhrases = rawDuePhrases.map((p) =>
    personalizeReviewPhrase(p, language?.code, learnerIdentity)
  );

  // Collect all unique word IDs and batch-fetch word families
  const allWordIds = new Set<string>();
  dueWords.forEach(w => allWordIds.add(w.word_id));
  practiceWords.forEach(w => allWordIds.add(w.word_id));

  const wordFamiliesMap: Record<string, LearnWordFamily[]> = {};
  await Promise.all(
    Array.from(allWordIds).map(async (wordId) => {
      const families = await getWordFamilies(wordId);
      if (families.length > 0) {
        wordFamiliesMap[wordId] = families.map(f => ({
          affix_type: f.affix_type,
          derived_word: f.derived_text,
          derived_meaning: f.derived_meaning_en,
          meaning_shift: f.meaning_shift ?? '',
        }));
      }
    })
  );

  // Fetch word-level mnemonics for all due phrases
  const phraseIds = duePhrases.map(p => p.phrase_id);
  const phraseWordRows = await getPhraseWordsWithMnemonics(phraseIds, session.user.id);
  const phraseWordMap: Record<string, PhraseWordMnemonic[]> = {};
  for (const pw of phraseWordRows) {
    if (!phraseWordMap[pw.phrase_id]) phraseWordMap[pw.phrase_id] = [];
    phraseWordMap[pw.phrase_id].push({
      word_id: pw.word_id,
      word_text: pw.word_text,
      word_en: pw.word_en,
      part_of_speech: pw.part_of_speech,
      position: pw.position,
      keyword_text: pw.keyword_text,
      bridge_sentence:
        pw.bridge_sentence && isPersonalizableLanguage(language?.code)
          ? personalizeEn(pw.bridge_sentence, learnerIdentity.firstName)
          : pw.bridge_sentence,
      image_url: pw.image_url,
    });
  }

  return (
    <div className="max-w-lg mx-auto -mt-2">
      <ReviewClient dueWords={dueWords} duePhrases={duePhrases} practiceWords={practiceWords} wordFamiliesMap={wordFamiliesMap} phraseWordMap={phraseWordMap} languageCode={language?.code ?? null} otherLanguagesDue={otherLanguagesDue.map(o => ({ code: o.code, name: o.name, count: o.due_count }))} insightState={{ seenIds: Array.from(insightState.seenIds), shownToday: insightState.shownToday }} />
    </div>
  );
}
