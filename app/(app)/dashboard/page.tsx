import { getMockDashboardData } from '@/lib/mocks/learning-data';
import { ContinueLearningCard } from '@/components/learn/ContinueLearningCard';
import { QuickReviewCard } from '@/components/learn/QuickReviewCard';
import { ProgressStats } from '@/components/learn/ProgressStats';
import { StreakCounter } from '@/components/learn/StreakCounter';
import { DashboardUpgradeBanner } from './DashboardUpgradeBanner';

export default function DashboardPage() {
  const data = getMockDashboardData();

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
        <StreakCounter streak={data.streak} />
      </div>

      {/* Continue Learning */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
          Continue Learning
        </h2>
        <ContinueLearningCard
          pathTitle={data.activePath.title}
          sceneTitle={data.activeScene.title}
          sceneId={data.activeScene.id}
          progress={data.sceneProgress}
        />
      </section>

      {/* Quick Review */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
          Review
        </h2>
        <QuickReviewCard dueCount={data.dueWordCount} />
      </section>

      {/* Progress Stats */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
          Your Progress
        </h2>
        <ProgressStats
          wordsLearned={data.wordsLearned}
          wordsMastered={data.wordsMastered}
          streak={data.streak}
        />
      </section>
    </div>
  );
}
