'use client';

import { useRouter } from 'next/navigation';
import { IconButton } from '@/components/ui/IconButton';
import { HeroCard } from '@/components/ui/HeroCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PathJourneyMap } from '@/components/learn/PathJourneyMap';
import { isSceneComplete } from '@/lib/utils/scene-progress';
import { habitatFromLanguageCode } from '@/lib/utils/language-habitat';
import { displayPathTitle } from '@/lib/utils/path-display';
import type { Path } from '@/types/database';
import type { SceneMasteryRow, PathWordStats } from '@/lib/db/queries';

interface PathDetailClientProps {
  path: Path;
  languageName: string;
  languageCode: string | null;
  sceneMastery: SceneMasteryRow[];
  wordStats: PathWordStats;
}

function tierSuffix(type: Path['type']): string {
  switch (type) {
    case 'travel':
      return ' · Travel pack';
    case 'studio':
      return ' · Studio';
    case 'custom':
      return ' · Custom';
    case 'premade':
    default:
      return '';
  }
}

export function PathDetailClient({
  path,
  languageName,
  languageCode,
  sceneMastery,
  wordStats,
}: PathDetailClientProps) {
  const router = useRouter();
  const habitat = habitatFromLanguageCode(languageCode);

  const completedScenes = sceneMastery.filter(isSceneComplete).length;
  const totalScenes = sceneMastery.length;
  const nextScene = sceneMastery.find((s) => !isSceneComplete(s));

  const wordProgress =
    wordStats.total_words > 0 ? wordStats.words_learned / wordStats.total_words : 0;
  const pathComplete = totalScenes > 0 && completedScenes === totalScenes;

  const subtitle =
    totalScenes > 0
      ? `${wordStats.words_learned}/${wordStats.total_words} words · ${completedScenes}/${totalScenes} scenes`
      : `${wordStats.words_learned}/${wordStats.total_words} words`;

  const ctaText = pathComplete
    ? 'Path complete'
    : wordStats.words_learned === 0
      ? 'Start'
      : 'Continue';

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-24">
      {/* Back affordance */}
      <div className="flex items-center gap-3">
        <IconButton label="Back to paths" onClick={() => router.push('/paths')} size="sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </IconButton>
        <div className="text-[11px] font-extrabold tracking-[0.16em] uppercase text-[color:var(--text-secondary)]">
          {languageName}
          {tierSuffix(path.type)}
        </div>
      </div>

      {/* Language-themed hero */}
      <HeroCard
        label={languageName}
        title={displayPathTitle(path.title)}
        subtitle={subtitle}
        progress={wordProgress}
        ctaText={ctaText}
        href={nextScene ? `/learn/${nextScene.id}` : undefined}
        onClick={nextScene ? undefined : () => router.push('/paths')}
        language={habitat}
      />

      {/* Completion handoff — no dead ends */}
      {pathComplete && (
        <EmptyStateCard
          foxPose="celebrating"
          title="Path complete!"
          subtitle={
            <>
              You&apos;ve finished <b>{displayPathTitle(path.title)}</b> — {wordStats.words_learned} words mastered
              across {totalScenes} scenes.
            </>
          }
          primary={{ label: 'Review what you learned', href: '/review' }}
          secondary={{ label: 'Explore another path', href: '/paths' }}
        />
      )}

      {/* Journey Map — unchanged */}
      <PathJourneyMap sceneMastery={sceneMastery} pathId={path.id} />
    </div>
  );
}
