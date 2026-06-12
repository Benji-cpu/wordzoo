import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserActivePath,
  getSceneMasteryForPath,
  getDueWordCount,
  getLanguageById,
  getUserStreak,
  getUserXp,
  getTodayInfoByte,
  getDailyLearningStats,
} from '@/lib/db/queries';
import { getDuePhraseCount } from '@/lib/db/scene-flow-queries';
import { isSceneComplete, sceneProgress as getSceneProgress, findCurrentSceneIndex } from '@/lib/utils/scene-progress';
import { habitatFromLanguageCode } from '@/lib/utils/language-habitat';
import { StreakFlame } from '@/components/ui/StreakFlame';
import { Fox } from '@/components/mascot/Fox';
import { HeroCard } from '@/components/ui/HeroCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import Link from 'next/link';
import { InfoByteCard } from '@/components/info-bytes/InfoByteCard';
import { DailyRecap } from '@/components/learn/DailyRecap';
import { DashboardUpgradeBanner } from './DashboardUpgradeBanner';
import { getInsightState } from '@/lib/db/insight-queries';
import { getEligibleInsight } from '@/lib/insights/engine';
import { DashboardInsight } from './DashboardInsight';
import { getTripContext } from '@/lib/services/trip-service';
import { TripHero } from '@/components/dashboard/TripHero';
import { ReviewQueueCard } from '@/components/dashboard/ReviewQueueCard';
import { GoalProgressCard } from '@/components/dashboard/GoalProgressCard';
import { LevelBadge } from '@/components/dashboard/LevelBadge';

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

  const [
    sceneMastery,
    dueWordCount,
    duePhraseCount,
    language,
    streakData,
    todayInfoByte,
    yesterdayStats,
    insightState,
    tripContext,
    xpData,
  ] = await Promise.all([
    getSceneMasteryForPath(userId, pathId),
    getDueWordCount(userId, languageId),
    getDuePhraseCount(userId, languageId),
    getLanguageById(languageId),
    getUserStreak(userId),
    getTodayInfoByte(languageId),
    getDailyLearningStats(userId, yesterdayStr),
    getInsightState(userId),
    getTripContext(userId),
    getUserXp(userId),
  ]);

  const firstName = session.user.name?.split(/\s+/)[0] ?? null;
  const greeting = pickGreeting();
  const kicker = pickKicker(streakData.current_streak);
  const habitat = habitatFromLanguageCode(language?.code);

  const nextScene = sceneMastery.find(s => !isSceneComplete(s)) ?? sceneMastery[0];
  const currentSceneIndex = findCurrentSceneIndex(sceneMastery);
  const currentSceneProgress = nextScene ? getSceneProgress(nextScene) : 0;

  const totalDueCount = dueWordCount + duePhraseCount;
  // Review sessions load at most 20 words + 20 phrases per sitting
  const dueExceedsSession = dueWordCount > 20 || duePhraseCount > 20;

  const completedSceneCount = sceneMastery.filter(s => isSceneComplete(s)).length;
  const totalWordsLearnedFromScenes = sceneMastery.reduce((sum, s) => sum + (s.mastered_words ?? 0), 0);
  const dashboardInsight = getEligibleInsight('dashboard', {
    seenInsightIds: insightState.seenIds,
    insightsShownToday: insightState.shownToday,
    totalMnemonicsViewed: 0,
    totalScenesCompleted: completedSceneCount,
    totalWordsLearned: totalWordsLearnedFromScenes,
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
        <div className="flex items-center gap-3 shrink-0">
          <LevelBadge xpTotal={xpData.xp_total} />
          <StreakFlame count={streak} size="sm" active={streak > 0} />
        </div>
      </div>

      {/* Streak at risk — nudge before it resets, with the action that saves it */}
      {streak > 0 && !streakData.active_today && (
        <Link
          href={hasReviews ? '/review' : hasNextScene ? `/learn/${nextScene!.id}` : '/paths'}
          className="flex items-center gap-2.5 rounded-2xl px-4 py-3 bg-amber-500/10 border border-amber-500/25 active:scale-[0.99] transition-transform"
        >
          <span aria-hidden className="text-lg">🔥</span>
          <span className="text-[13px] font-bold text-[color:var(--foreground)]">
            {streak}-day streak on the line — {hasReviews ? 'one quick review keeps it alive' : 'learn one word to keep it alive'}
          </span>
          <span aria-hidden className="ml-auto font-black text-amber-600">›</span>
        </Link>
      )}

      {/* Review queue — top priority when reviews are due */}
      {hasReviews && (
        <ReviewQueueCard
          dueCount={totalDueCount}
          languageName={language?.name}
          startWithMostOverdue={dueExceedsSession}
        />
      )}

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
      ) : tripContext.hasTrip && hasNextScene ? (
        <TripHero
          trip={tripContext}
          ctaHref={`/learn/${nextScene!.id}`}
          ctaLabel="Resume session"
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

      {/* Goal meter — suppressed when TripHero is the hero (would duplicate trip data) */}
      {!(tripContext.hasTrip && hasNextScene) && (
        <GoalProgressCard tripContext={tripContext} />
      )}

      {/* Yesterday's recap (compact — review CTA lives above) */}
      <DailyRecap
        yesterdayWords={yesterdayStats.words_learned}
        yesterdayScenes={yesterdayStats.scenes_completed}
        variant="compact"
      />

      {/* Daily Info Byte */}
      {todayInfoByte && (
        <InfoByteCard
          languageCode={
            language?.code === 'id' || language?.code === 'es' || language?.code === 'ja' || language?.code === 'pt'
              ? language.code
              : undefined
          }
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

      {/* Learning-loop insight */}
      {dashboardInsight && <DashboardInsight insight={dashboardInsight} />}

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
