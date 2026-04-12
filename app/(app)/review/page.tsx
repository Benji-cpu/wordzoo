import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDueWords, getDuePhrases } from '@/lib/srs/engine';
import { getAllLearnedWordsForPractice, getWordFamilies } from '@/lib/db/queries';
import { ReviewClient } from '@/components/learn/ReviewClient';
import type { LearnWordFamily } from '@/components/learn/LearnClient';

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [dueWords, duePhrases, practiceWords] = await Promise.all([
    getDueWords(session.user.id),
    getDuePhrases(session.user.id),
    getAllLearnedWordsForPractice(session.user.id),
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

  return (
    <div className="max-w-lg mx-auto">
      <ReviewClient dueWords={dueWords} duePhrases={duePhrases} practiceWords={practiceWords} wordFamiliesMap={wordFamiliesMap} />
    </div>
  );
}
