import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserActivePath,
  upsertUserPath,
  getSceneMasteryForPath,
  getPathWordStats,
  getUserDueWords,
} from '@/lib/db/queries';
import { ContinueLearningCard } from '@/components/learn/ContinueLearningCard';
import { QuickReviewCard } from '@/components/learn/QuickReviewCard';
import { ProgressStats } from '@/components/learn/ProgressStats';
import { StreakCounter } from '@/components/learn/StreakCounter';
import Link from 'next/link';
import { DashboardUpgradeBanner } from './DashboardUpgradeBanner';

const DEFAULT_INDONESIAN_PATH_ID = 'c1000000-0001-4000-8000-000000000001';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const isAdmin = adminEmails.includes(session.user.email ?? '');

  // Get user's active path, or auto-enroll in default Indonesian path
  let activePath = await getUserActivePath(userId);
  if (!activePath) {
    await upsertUserPath(userId, DEFAULT_INDONESIAN_PATH_ID, 'active');
    activePath = await getUserActivePath(userId);
  }

  // If still no path (e.g. path doesn't exist in DB), show empty state
  if (!activePath) {
    return (
      <div className="max-w-lg mx-auto space-y-4 pb-24">
        <DashboardUpgradeBanner />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            No learning path found. Visit Paths to get started.
          </p>
        </div>
      </div>
    );
  }

  const pathId = activePath.path_id;
  const languageId = activePath.path_language_id;

  // Fetch scene mastery, word stats, and due words in parallel
  const [sceneMastery, wordStats, dueWords] = await Promise.all([
    getSceneMasteryForPath(userId, pathId),
    getPathWordStats(userId, pathId),
    getUserDueWords(userId, languageId),
  ]);

  // Find next incomplete scene (first where mastered_words < total_words)
  const nextScene = sceneMastery.find(s => s.mastered_words < s.total_words) ?? sceneMastery[0];

  // Calculate scene progress percentage
  const sceneProgress = nextScene && nextScene.total_words > 0
    ? Math.round((nextScene.mastered_words / nextScene.total_words) * 100)
    : 0;

  // Streak: placeholder for now (no streak table yet)
  const streak = 0;

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-24">
      {/* Upgrade banner for free tier near quota */}
      <DashboardUpgradeBanner />

      {/* Greeting + Streak */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Keep building your Indonesian vocabulary
          </p>
        </div>
        <StreakCounter streak={streak} />
      </div>

      {/* Continue Learning */}
      {nextScene && (
        <section>
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            Continue Learning
          </h2>
          <ContinueLearningCard
            pathTitle={activePath.path_title}
            sceneTitle={nextScene.title}
            sceneId={nextScene.id}
            progress={sceneProgress}
          />
        </section>
      )}

      {/* Quick Review */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
          Review
        </h2>
        <QuickReviewCard dueCount={dueWords.length} />
      </section>

      {/* Progress Stats */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
          Your Progress
        </h2>
        <ProgressStats
          wordsLearned={wordStats.words_learned}
          wordsMastered={wordStats.words_mastered}
          streak={streak}
        />
      </section>

      {/* Admin link — only visible to admin users */}
      {isAdmin && (
        <Link
          href="/admin/feedback"
          className="block text-center text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          Admin: Mnemonic Feedback
        </Link>
      )}
    </div>
  );
}
