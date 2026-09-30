import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getReviewSitting, REVIEW_SITTING } from '@/lib/srs/engine';
import { getAllLearnedWordsForPractice, getWordFamilies, getUserActivePath, getLanguageById } from '@/lib/db/queries';
import { getPhraseWordsWithMnemonics } from '@/lib/db/scene-flow-queries';
import { getFragileDueTotal } from '@/lib/db/gate-queries';
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "Practice now" runs through this many learned words, least recently seen first. */
const PRACTICE_SITTING = 20;
/** Learned words sent to the client as listening distractors and same-meaning alternates. */
const WORD_POOL_LIMIT = 300;

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ scene?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // `?scene=` is the "Lock these in" hand-off from a scene summary. It goes
  // into a ::uuid cast, so anything that is not a uuid is dropped here.
  const { scene } = await searchParams;
  const sceneParam = Array.isArray(scene) ? scene[0] : scene;
  const priorityScene = sceneParam && UUID.test(sceneParam) ? sceneParam : null;

  // Scope review to the user's active path's language so they aren't reviewing
  // words from a path they're not currently working on. If no active path,
  // fall back to all-language review.
  const activePath = await getUserActivePath(session.user.id);
  const languageId = activePath?.path_language_id ?? null;

  // One sitting (REVIEW_SITTING), in the order the engine composes it. The
  // uncapped totals come along too, so the end screen can say how much is
  // still waiting instead of pretending the queue is empty.
  const [sitting, learnedWords, insightState, language, profile, fragileDueTotal] = await Promise.all([
    getReviewSitting(session.user.id, languageId, { priorityScene }),
    getAllLearnedWordsForPractice(session.user.id, WORD_POOL_LIMIT, languageId),
    getInsightState(session.user.id),
    languageId ? getLanguageById(languageId) : Promise.resolve(null),
    getUserProfile(session.user.id),
    getFragileDueTotal(session.user.id, languageId),
  ]);
  const dueWords = sitting.words;
  const practiceWords = learnedWords.slice(0, PRACTICE_SITTING);
  const wordPool = learnedWords.map((w) => ({ id: w.word_id, text: w.text, meaning_en: w.meaning_en }));

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
  const duePhrases = sitting.phrases.map((p) => personalizeReviewPhrase(p, language?.code, learnerIdentity));

  // Word families for the words that can be asked (the sitting, or practice).
  const familyWordIds = new Set<string>();
  dueWords.forEach((w) => familyWordIds.add(w.word_id));
  practiceWords.forEach((w) => familyWordIds.add(w.word_id));

  const wordFamiliesMap: Record<string, LearnWordFamily[]> = {};
  await Promise.all(
    Array.from(familyWordIds).map(async (wordId) => {
      const families = await getWordFamilies(wordId);
      if (families.length > 0) {
        wordFamiliesMap[wordId] = families.map((f) => ({
          affix_type: f.affix_type,
          derived_word: f.derived_text,
          derived_meaning: f.derived_meaning_en,
          meaning_shift: f.meaning_shift ?? '',
        }));
      }
    }),
  );

  // Word-level mnemonics for every phrase in the sitting: shown after a miss.
  const phraseIds = duePhrases.map((p) => p.phrase_id);
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
      <ReviewClient
        dueWords={dueWords}
        duePhrases={duePhrases}
        practiceWords={practiceWords}
        wordPool={wordPool}
        wordFamiliesMap={wordFamiliesMap}
        phraseWordMap={phraseWordMap}
        languageCode={language?.code ?? null}
        dueTotal={sitting.dueWordTotal + sitting.duePhraseTotal}
        fragileDueTotal={fragileDueTotal}
        sittingSize={REVIEW_SITTING.words + REVIEW_SITTING.phrases}
        learnerName={learnerIdentity.firstName}
        sceneId={priorityScene}
        insightState={{ seenIds: Array.from(insightState.seenIds), shownToday: insightState.shownToday }}
      />
    </div>
  );
}
