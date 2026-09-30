import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserActivePath,
  getSceneMasteryForPath,
  getDueWordCount,
  getLanguageById,
  getUserStreak,
  getUserXp,
} from '@/lib/db/queries';
import { getDailyDose } from '@/lib/daily-dose';
import { getDuePhraseCount } from '@/lib/db/scene-flow-queries';
import { isSceneComplete, sceneProgress as getSceneProgress, findCurrentSceneIndex } from '@/lib/utils/scene-progress';
import { habitatFromLanguageCode } from '@/lib/utils/language-habitat';
import { StreakFlame } from '@/components/ui/StreakFlame';
import { Fox } from '@/components/mascot/Fox';
import { HeroCard } from '@/components/ui/HeroCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import Link from 'next/link';
import { InfoByteCard } from '@/components/info-bytes/InfoByteCard';
import { REVIEW_SITTING } from '@/lib/srs/engine';
import { getWeekRecall } from '@/lib/db/pedagogy-queries';
import { Card } from '@/components/ui/Card';
import { DashboardUpgradeBanner } from './DashboardUpgradeBanner';
import { getInsightState } from '@/lib/db/insight-queries';
import { getEligibleInsight } from '@/lib/insights/engine';
import { DashboardInsight } from './DashboardInsight';
import { getTripContext } from '@/lib/services/trip-service';
import { TripHero } from '@/components/dashboard/TripHero';
import { ReviewQueueCard } from '@/components/dashboard/ReviewQueueCard';
import { GoalProgressCard } from '@/components/dashboard/GoalProgressCard';
import { CanDoInventoryCard } from '@/components/dashboard/CanDoInventoryCard';
import { getCanDoInventory } from '@/lib/db/can-do-queries';
import { LevelBadge } from '@/components/dashboard/LevelBadge';
import { isAdminEmail } from '@/lib/auth/admin';
import { getNewContentGate, getRecentSceneCompletions } from '@/lib/db/gate-queries';
import { lockInFirstLabel, paceNote, reviewMinutes } from '@/lib/pedagogy/gate';

function pickGreeting(short: boolean): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up?';
  // Short forms keep "Greeting, Name" on one line next to the level/streak
  // badges on a 390px viewport.
  if (hour < 12) return short ? 'Morning' : 'Good morning';
  if (hour < 17) return short ? 'Afternoon' : 'Good afternoon';
  if (hour < 21) return short ? 'Evening' : 'Good evening';
  return short ? 'Night' : 'Good night';
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
  const isAdmin = isAdminEmail(session.user.email);

  // Get user's active path — if none, redirect to path selection
  const activePath = await getUserActivePath(userId);
  if (!activePath) {
    redirect('/paths');
  }

  const pathId = activePath.path_id;
  const languageId = activePath.path_language_id;

  const [
    sceneMastery,
    dueWordCount,
    duePhraseCount,
    language,
    streakData,
    weekRecall,
    insightState,
    tripContext,
    xpData,
    canDoInventory,
  ] = await Promise.all([
    getSceneMasteryForPath(userId, pathId),
    getDueWordCount(userId, languageId),
    getDuePhraseCount(userId, languageId),
    getLanguageById(languageId),
    getUserStreak(userId),
    getWeekRecall(userId),
    getInsightState(userId),
    getTripContext(userId),
    getUserXp(userId),
    getCanDoInventory(userId, languageId),
  ]);

  // The next scene is the first unfinished one in path order; null once the
  // whole path is done (it used to fall back to scene 1, which made "caught up"
  // unreachable). Its gate and the pace history need it, so they load second.
  const nextScene = sceneMastery.find(s => !isSceneComplete(s)) ?? null;
  const [gate, completedRecently] = await Promise.all([
    nextScene ? getNewContentGate(userId, nextScene.id) : Promise.resolve(null),
    getRecentSceneCompletions(userId, pathId),
  ]);

  const dailyDose = getDailyDose(language?.code);

  const firstName = session.user.name?.split(/\s+/)[0] ?? null;
  const greeting = pickGreeting(Boolean(firstName));
  const kicker = pickKicker(streakData.current_streak);
  const habitat = habitatFromLanguageCode(language?.code);

  const currentSceneIndex = findCurrentSceneIndex(sceneMastery);
  const currentSceneProgress = nextScene ? getSceneProgress(nextScene) : 0;

  const totalDueCount = dueWordCount + duePhraseCount;
  // What /review will actually load: one sitting, not the whole backlog.
  const sittingCount =
    Math.min(dueWordCount, REVIEW_SITTING.words) + Math.min(duePhraseCount, REVIEW_SITTING.phrases);

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
  const pathComplete = sceneMastery.length > 0 && !nextScene;
  const caughtUp = !hasReviews && !hasNextScene;

  // Hero state: a closed gate turns the hero into "lock in N first" (the next
  // scene is named as what it unlocks); otherwise start or resume the scene.
  const gateClosed = !!gate && !gate.open;
  const sceneStarted = !!nextScene?.current_phase;
  const heroHref = gateClosed ? '/review' : `/learn/${nextScene?.id}`;
  const heroLabel = !nextScene
    ? ''
    : gateClosed
      ? lockInFirstLabel(gate!.fragileDue)
      : `${sceneStarted ? 'Resume' : 'Start'} ${nextScene.title}`;
  const sittingMinutes = reviewMinutes(sittingCount);
  const heroNote = gateClosed
    ? `Unlocks: ${nextScene!.title} · next round about ${sittingMinutes} min`
    : null;
  const heroSecondary = gateClosed
    ? { label: 'Start the scene anyway', href: `/learn/${nextScene!.id}?anyway=1` }
    : null;
  const pace = paceNote({
    scenes: sceneMastery.map(s => ({ id: s.id, title: s.title, completed: isSceneComplete(s) })),
    completedRecently,
    tripDate: tripContext.tripDate,
  });

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
            <h1 className="text-[19px] min-[420px]:text-[22px] font-extrabold tracking-tight text-[color:var(--foreground)] leading-tight truncate">
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
          href={hasReviews || gateClosed ? '/review' : hasNextScene ? `/learn/${nextScene!.id}` : '/paths'}
          className="flex items-center gap-2.5 rounded-2xl px-4 py-3 bg-amber-500/10 border border-amber-500/25 active:scale-[0.99] transition-transform"
        >
          <span aria-hidden className="text-lg">🔥</span>
          <span className="text-[13px] font-bold text-[color:var(--foreground)]">
            {streak}-day streak on the line — {hasReviews ? 'one quick review keeps it alive' : 'learn one word to keep it alive'}
          </span>
          <span aria-hidden className="ml-auto font-black text-amber-600">›</span>
        </Link>
      )}

      {/* Review queue — top priority when reviews are due. With the gate closed
          the hero already carries "lock in N first", so this card would be a
          second, differently-numbered button to the same place. */}
      {hasReviews && !gateClosed && (
        <ReviewQueueCard
          sittingCount={sittingCount}
          laterCount={totalDueCount - sittingCount}
          languageName={language?.name}
        />
      )}

      {/* Hero / empty state */}
      {!hasNextScene ? (
        <EmptyStateCard
          foxPose="proud"
          title={pathComplete ? 'Path complete' : "You've cleared review"}
          subtitle={
            pathComplete ? (
              <>
                You&apos;ve finished every scene{hasReviews ? '. Keep what you learned fresh.' : ' and cleared review. Nothing due until tomorrow.'}
              </>
            ) : (
              'Nothing due until tomorrow.'
            )
          }
          primary={{ label: hasReviews ? 'Review now →' : 'Chat with Fox →', href: hasReviews ? '/review' : '/tutor' }}
          secondary={{ label: 'See the path', href: `/paths/${pathId}` }}
        />
      ) : tripContext.hasTrip && hasNextScene ? (
        <TripHero
          trip={tripContext}
          ctaHref={heroHref}
          ctaLabel={heroLabel}
          nextNote={heroNote}
          paceNote={pace}
          secondary={heroSecondary}
        />
      ) : hasNextScene ? (
        <HeroCard
          label={gateClosed ? 'Lock in first' : sceneStarted ? 'Continue' : 'Next scene'}
          title={nextScene!.title}
          subtitle={
            gateClosed
              ? `Unlocks after a short round · about ${sittingMinutes} min`
              : currentSceneIndex >= 0 && sceneMastery.length > 0
                ? `${language?.name ?? 'Learning'} · scene ${currentSceneIndex + 1} of ${sceneMastery.length}`
                : language?.name ?? 'Resume learning'
          }
          progress={gateClosed ? undefined : currentSceneProgress}
          ctaText={heroLabel}
          href={heroHref}
          language={habitat}
        />
      ) : null}

      {/* Capability inventory — the answer to "what can I actually do?".
          Shown once there's anything to say; otherwise the slot falls through
          to GoalProgressCard as before. */}
      {(canDoInventory.certified > 0 || canDoInventory.due_now > 0) && (
        <CanDoInventoryCard
          inventory={canDoInventory}
          languageName={language?.name ?? 'your language'}
        />
      )}

      {/* Goal meter — suppressed when TripHero is the hero (would duplicate
          trip data), and also when the can-do card is carrying the "here's
          your direction" slot AND there's no real trip to count down to. A
          genuine trip countdown always survives; only the empty
          "set a learning goal" state gets displaced. */}
      {!(tripContext.hasTrip && hasNextScene) &&
        (tripContext.hasTrip || canDoInventory.certified === 0) && (
        <GoalProgressCard tripContext={tripContext} />
      )}

      {/* 7-day recall — whether the pictures work. Of the items met again
          after a week or more away, how many were still there. */}
      <Card size="compact">
        <p className="text-sm text-foreground">
          <span className="font-semibold">7-day recall: </span>
          {weekRecall.reviews > 0 ? (
            <>
              <span className="font-semibold">
                {Math.round((100 * weekRecall.remembered) / weekRecall.reviews)}%
              </span>
              <span className="text-text-secondary">
                {' '}· {weekRecall.remembered} of {weekRecall.reviews} remembered after a week or more away
              </span>
            </>
          ) : (
            <span className="text-text-secondary">
              not measured yet — it counts reviews of words you hadn&apos;t seen for 7+ days
            </span>
          )}
        </p>
      </Card>

      {/* Daily Dose — written ahead in lib/daily-dose, one card per day */}
      {dailyDose && (
        <InfoByteCard
          languageCode={
            language?.code === 'id' || language?.code === 'es' || language?.code === 'ja' || language?.code === 'pt'
              ? language.code
              : undefined
          }
          category={dailyDose.category}
          topicSummary={dailyDose.topic_summary}
          easyTarget={dailyDose.easy_target}
          easyEnglish={dailyDose.easy_english}
          mediumTarget={dailyDose.medium_target}
          mediumEnglish={dailyDose.medium_english}
          hardTarget={dailyDose.hard_target}
          hardEnglish={dailyDose.hard_english}
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
