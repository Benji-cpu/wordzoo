import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDueWords, getDuePhrases } from '@/lib/srs/engine';
import { getAllLearnedWordsForPractice, getWordFamilies } from '@/lib/db/queries';
import { getPhraseWordsWithMnemonics } from '@/lib/db/scene-flow-queries';
import { getInsightState } from '@/lib/db/insight-queries';
import { ReviewClient } from '@/components/learn/ReviewClient';
import type { LearnWordFamily } from '@/components/learn/LearnClient';
import type { PhraseWordMnemonic } from '@/types/database';

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [dueWords, duePhrases, practiceWords, insightState] = await Promise.all([
    getDueWords(session.user.id),
    getDuePhrases(session.user.id),
    getAllLearnedWordsForPractice(session.user.id),
    getInsightState(session.user.id),
  ]);

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
      bridge_sentence: pw.bridge_sentence,
      image_url: pw.image_url,
    });
  }

  return (
    <div className="max-w-lg mx-auto -mt-2">
      <ReviewClient dueWords={dueWords} duePhrases={duePhrases} practiceWords={practiceWords} wordFamiliesMap={wordFamiliesMap} phraseWordMap={phraseWordMap} insightState={{ seenIds: Array.from(insightState.seenIds), shownToday: insightState.shownToday }} />
    </div>
  );
}
