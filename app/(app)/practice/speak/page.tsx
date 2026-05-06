import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserActivePath,
  getSceneMasteryForPath,
  getSceneWordsWithDetails,
  getUserDueWords,
  getLanguageById,
  getUserById,
} from '@/lib/db/queries';
import { getDailyUsageForUser } from '@/lib/services/billing-service';
import { isSceneComplete } from '@/lib/utils/scene-progress';
import { SpeakingSession } from '@/components/practice/SpeakingSession';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SpeakPracticePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const activePath = await getUserActivePath(userId);
  if (!activePath) redirect('/paths');

  const [sceneMastery, language, usage, user] = await Promise.all([
    getSceneMasteryForPath(userId, activePath.path_id),
    getLanguageById(activePath.path_language_id),
    getDailyUsageForUser(userId),
    getUserById(userId),
  ]);

  const currentScene = sceneMastery.find((s) => !isSceneComplete(s)) ?? sceneMastery[0];

  // Build the queue: current scene's learned-or-better words first, then due-review fillers, dedup, cap at 8.
  let queue: string[] = [];
  if (currentScene) {
    const sceneWords = await getSceneWordsWithDetails(currentScene.id, userId);
    queue = sceneWords
      .filter((w) => w.user_word_status === 'learning' || w.user_word_status === 'reviewing' || w.user_word_status === 'mastered')
      .map((w) => w.word_id);
  }

  if (queue.length < 8) {
    const due = await getUserDueWords(userId, activePath.path_language_id, 12);
    for (const d of due) {
      if (queue.length >= 8) break;
      if (!queue.includes(d.word_id)) queue.push(d.word_id);
    }
  }

  queue = queue.slice(0, 8);

  const isPremium = user?.subscription_tier === 'premium';

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--foreground)]"
        >
          ← Dashboard
        </Link>
        {!isPremium && (
          <span className="text-[11px] uppercase tracking-[0.14em] font-extrabold text-[color:var(--text-secondary)]">
            Free tier
          </span>
        )}
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] font-extrabold text-[color:var(--text-secondary)]">
          {language?.name ?? 'Practice'} · speaking
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">Say it out loud</h1>
      </div>

      <SpeakingSession
        wordIds={queue}
        languageName={language?.name ?? 'your language'}
        initialUsageSeconds={usage.hands_free_seconds.current}
        freeLimitSeconds={usage.hands_free_seconds.limit}
        isPremium={isPremium}
      />
    </div>
  );
}
