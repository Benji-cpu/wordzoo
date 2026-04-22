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
import { habitatFromLanguageCode } from '@/lib/utils/language-habitat';
import { ProgressChart } from '@/components/learn/ProgressChart';
import { StreakFlame } from '@/components/ui/StreakFlame';
import { Fox } from '@/components/mascot/Fox';
import { TutorNudgeCard } from '@/components/tutor/TutorNudgeCard';
import { TutorInsights } from '@/components/tutor/TutorInsights';
import { HeroCard } from '@/components/ui/HeroCard';
import { ActionCard, ActionCardRow } from '@/components/ui/ActionCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import Link from 'next/link';
import { InfoByteCard } from '@/components/info-bytes/InfoByteCard';
import { DailyRecap } from '@/components/learn/DailyRecap';
import { DashboardUpgradeBanner } from './DashboardUpgradeBanner';
import { getInsightState } from '@/lib/db/insight-queries';
import { getEligibleInsight } from '@/lib/insights/engine';
import { DashboardInsight } from './DashboardInsight';

function pickGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function pickKicker(streak: number): string {
  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  if (streak > 0) return `${weekday} · day ${streak}`;
  return weekday;
}

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

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const [
    sceneMastery,
    wordStats,
    dueWords,
    duePhrases,
    language,
    streakData,
    masteryDist,
    wordsByStatus,
    todayInfoByte,
    yesterdayStats,
    todayStats,
    insightState,
  ] = await Promise.all([
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
    getDailyLearningStats(userId, todayStr),
    getInsightState(userId),
  ]);

  const firstName = session.user.name?.split(/\s+/)[0] ?? null;
  const greeting = pickGreeting();
  const kicker = pickKicker(streakData.current_streak);
  const habitat = habitatFromLanguageCode(language?.code);

  const nextScene = sceneMastery.find(s => !isSceneComplete(s)) ?? sceneMastery[0];
  const currentSceneIndex = findCurrentSceneIndex(sceneMastery);
  const currentSceneProgress = nextScene ? getSceneProgress(nextScene) : 0;

  const totalDueCount = dueWords.length + duePhrases.length;
  const newWordsToday = wordStats.words_learned - (todayStats.words_learned ?? 0) >= 0
    ? Math.max(0, todayStats.words_learned ?? 0)
    : 0;

  const completedSceneCount = sceneMastery.filter(s => isSceneComplete(s)).length;
  const dashboardInsight = getEligibleInsight('dashboard', {
    seenInsightIds: insightState.seenIds,
    insightsShownToday: insightState.shownToday,
    totalMnemonicsViewed: 0,
    totalScenesCompleted: completedSceneCount,
    totalWordsLearned: wordStats.words_learned,
  });

  const streak = streakData.current_streak;
  const hasReviews = totalDueCount > 0;
  const hasNextScene = !!nextScene;
  const caughtUp = !hasReviews && !hasNextScene;

  return (
    <div className="max-w-lg lg:max-w-3xl mx-auto space-y-4">
      {/* Upgrade banner for free tier near quota */}
      <DashboardUpgradeBanner />

      {/* Greeting + streak */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-[14px] bg-[color:var(--accent-indonesian-soft)] flex items-center justify-center flex-shrink-0">
            <Fox pose={caughtUp ? 'proud' : hasReviews ? 'wave' : 'idle'} size="xs" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.12em] font-extrabold text-[color:var(--text-secondary)]">
              {kicker}
            </div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-[color:var(--foreground)] leading-tight truncate">
              {caughtUp ? 'All caught up!' : firstName ? `${greeting}, ${firstName}` : greeting}
            </h1>
          </div>
        </div>
        <StreakFlame count={streak} size="sm" active={streak > 0} />
      </div>

      {/* Hero / empty state */}
      {caughtUp ? (
        <EmptyStateCard
          foxPose="proud"
          title="You've cleared review"
          subtitle={
            <>
              Nothing due until tomorrow. Meet a few more words, or ask Fox about what
              you&apos;ve learned.
            </>
          }
          primary={{ label: 'Meet 3 new words →', href: '/paths' }}
          secondary={{ label: 'Chat about yesterday', href: '/tutor' }}
        />
      ) : hasNextScene ? (
        <HeroCard
          label="Continue"
          title={nextScene!.title}
          subtitle={
            currentSceneIndex >= 0 && sceneMastery.length > 0
              ? `${language?.name ?? 'Learning'} · scene ${currentSceneIndex + 1} of ${sceneMastery.length}`
              : language?.name ?? 'Resume learning'
          }
          progress={currentSceneProgress}
          ctaText="Resume session"
          href={`/learn/${nextScene!.id}`}
          language={habitat}
        />
      ) : null}

      {/* Action row — due / new */}
      {!caughtUp && (
        <ActionCardRow>
          <ActionCard icon="⏱️" value={totalDueCount} label="Due now" tone="warm" href="/review" />
          <ActionCard icon="✨" value={newWordsToday} label="New today" tone="cream" />
        </ActionCardRow>
      )}

      {/* Tutor Nudge (Insight archetype underneath) */}
      <TutorNudgeCard languageId={languageId} />

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

      {/* Yesterday's recap */}
      <DailyRecap
        yesterdayWords={yesterdayStats.words_learned}
        yesterdayScenes={yesterdayStats.scenes_completed}
        dueReviewCount={totalDueCount}
      />

      {/* Learning-loop insight */}
      {dashboardInsight && <DashboardInsight insight={dashboardInsight} />}

      {/* Progress Stats */}
      <section>
        <h2 className="text-[10.5px] font-extrabold text-[color:var(--text-secondary)] uppercase tracking-[0.16em] mb-2 px-1">
          Your progress
        </h2>
        <ProgressChart distribution={masteryDist} streak={streak} wordsByStatus={wordsByStatus} />
      </section>

      {/* Tutor Insights */}
      <section>
        <h2 className="text-[10.5px] font-extrabold text-[color:var(--text-secondary)] uppercase tracking-[0.16em] mb-2 px-1">
          Tutor
        </h2>
        <TutorInsights languageId={languageId} />
      </section>

      {/* Admin link */}
      {isAdmin && (
        <Link
          href="/admin"
          className="block text-center text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--foreground)] transition-colors py-2"
        >
          Admin Dashboard
        </Link>
      )}
    </div>
  );
}
