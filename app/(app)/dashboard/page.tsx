import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserActivePath,
  getSceneMasteryForPath,
  getPathWordStats,
  getUserDueWords,
  getLanguageById,
  getUserStreak,
  getWordMasteryDistribution,
  getWordsByMasteryStatus,
  getTodayInfoByte,
  getDailyLearningStats,
} from '@/lib/db/queries';
import { getDuePhrasesForReview } from '@/lib/db/scene-flow-queries';
import { isSceneComplete, sceneProgress as getSceneProgress, findCurrentSceneIndex } from '@/lib/utils/scene-progress';
import { ContinueLearningCard } from '@/components/learn/ContinueLearningCard';
import { QuickReviewCard } from '@/components/learn/QuickReviewCard';
import { ProgressChart } from '@/components/learn/ProgressChart';
import { StreakCounter } from '@/components/learn/StreakCounter';
import { TutorNudgeCard } from '@/components/tutor/TutorNudgeCard';
import { TutorInsights } from '@/components/tutor/TutorInsights';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { InfoByteCard } from '@/components/info-bytes/InfoByteCard';
import { DailyRecap } from '@/components/learn/DailyRecap';
import { DashboardUpgradeBanner } from './DashboardUpgradeBanner';
import { getInsightState } from '@/lib/db/insight-queries';
import { getEligibleInsight } from '@/lib/insights/engine';
import { DashboardInsight } from './DashboardInsight';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const isAdmin = adminEmails.includes(session.user.email ?? '');

  // Get user's active path — if none, redirect to path selection
  const activePath = await getUserActivePath(userId);
  if (!activePath) {
    redirect('/paths');
  }

  const pathId = activePath.path_id;
  const languageId = activePath.path_language_id;

  // Compute yesterday's date string
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Fetch scene mastery, word stats, due words/phrases, language, and mastery distribution in parallel
  const [sceneMastery, wordStats, dueWords, duePhrases, language, streakData, masteryDist, wordsByStatus, todayInfoByte, yesterdayStats, insightState] = await Promise.all([
    getSceneMasteryForPath(userId, pathId),
    getPathWordStats(userId, pathId),
    getUserDueWords(userId, languageId),
    getDuePhrasesForReview(userId, 100),
    getLanguageById(languageId),
    getUserStreak(userId),
    getWordMasteryDistribution(userId, pathId),
    getWordsByMasteryStatus(userId, pathId),
    getTodayInfoByte(languageId),
    getDailyLearningStats(userId, yesterdayStr),
    getInsightState(userId),
  ]);

  // Find next incomplete scene
  const nextScene = sceneMastery.find(s => !isSceneComplete(s)) ?? sceneMastery[0];
  const currentSceneIndex = findCurrentSceneIndex(sceneMastery);
  const currentSceneProgress = nextScene ? getSceneProgress(nextScene) : 0;

  const totalDueCount = dueWords.length + duePhrases.length;

  // Check for dashboard insight (learning_loop)
  const completedSceneCount = sceneMastery.filter(s => isSceneComplete(s)).length;
  const dashboardInsight = getEligibleInsight('dashboard', {
    seenInsightIds: insightState.seenIds,
    insightsShownToday: insightState.shownToday,
    totalMnemonicsViewed: 0,
    totalScenesCompleted: completedSceneCount,
    totalWordsLearned: wordStats.words_learned,
  });

  const streak = streakData.current_streak;

  return (
    <div className="max-w-lg lg:max-w-3xl mx-auto space-y-4">
      {/* Upgrade banner for free tier near quota */}
      <DashboardUpgradeBanner />

      {/* Daily Info Byte */}
      {todayInfoByte && (
        <InfoByteCard
          category={todayInfoByte.category}
          topicSummary={todayInfoByte.topic_summary}
          easyTarget={todayInfoByte.easy_target}
          easyEnglish={todayInfoByte.easy_english}
          mediumTarget={todayInfoByte.medium_target}
          mediumEnglish={todayInfoByte.medium_english}
          hardTarget={todayInfoByte.hard_target}
          hardEnglish={todayInfoByte.hard_english}
        />
      )}

      {/* Greeting + Streak */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-text-secondary mt-1">
            Keep building your {language?.name ?? 'language'} vocabulary
          </p>
        </div>
        <StreakCounter streak={streak} />
      </div>

      {/* Yesterday's recap */}
      <DailyRecap
        yesterdayWords={yesterdayStats.words_learned}
        yesterdayScenes={yesterdayStats.scenes_completed}
        dueReviewCount={totalDueCount}
      />

      {/* Learning Loop insight — only for users with 15+ words */}
      {dashboardInsight && (
        <DashboardInsight insight={dashboardInsight} />
      )}

      {/* Main actions */}
      {(() => {
        const hasReviews = totalDueCount > 0;
        const hasNextScene = !!nextScene;

        if (!hasReviews && !hasNextScene) {
          return (
            <section>
              <Card className="animate-fade-in text-center py-6">
                <h3 className="text-foreground font-semibold text-lg">All caught up!</h3>
                <p className="text-sm text-text-secondary mt-1 mb-4">
                  You&apos;ve mastered everything so far.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button href="/tutor" size="sm">Practice with Tutor</Button>
                  <Button href="/paths" variant="secondary" size="sm">Explore More Paths</Button>
                </div>
              </Card>
            </section>
          );
        }

        return (
          <>
            {hasReviews && (
              <section>
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Review
                </h2>
                <QuickReviewCard dueCount={totalDueCount} />
              </section>
            )}

            {/* Tutor Nudge */}
            <section>
              <TutorNudgeCard languageId={languageId} />
            </section>

            {hasNextScene && (
              <section>
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Continue Learning
                </h2>
                <ContinueLearningCard
                  sceneTitle={nextScene!.title}
                  sceneId={nextScene!.id}
                  progress={currentSceneProgress}
                  currentPhase={nextScene!.scene_type === 'dialogue' ? nextScene!.current_phase : undefined}
                  sceneIndex={currentSceneIndex}
                  totalScenes={sceneMastery.length}
                  sceneDots={sceneMastery.map(s => ({ id: s.id, completed: isSceneComplete(s) }))}
                />
              </section>
            )}
          </>
        );
      })()}

      {/* Progress Stats */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Your Progress
        </h2>
        <ProgressChart distribution={masteryDist} streak={streak} wordsByStatus={wordsByStatus} />
      </section>

      {/* Tutor Insights */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Tutor
        </h2>
        <TutorInsights languageId={languageId} />
      </section>

      {/* Admin link — only visible to admin users */}
      {isAdmin && (
        <Link
          href="/admin"
          className="block text-center text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          Admin Dashboard
        </Link>
      )}
    </div>
  );
}
