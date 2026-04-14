'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { PathJourneyMap } from '@/components/learn/PathJourneyMap';
import { isSceneComplete } from '@/lib/utils/scene-progress';
import type { Path } from '@/types/database';
import type { SceneMasteryRow, PathWordStats } from '@/lib/db/queries';

interface PathDetailClientProps {
  path: Path;
  languageName: string;
  sceneMastery: SceneMasteryRow[];
  wordStats: PathWordStats;
}

function tierLabel(type: Path['type']): string {
  switch (type) {
    case 'premade': return 'Premade';
    case 'custom': return 'Custom';
    case 'travel': return 'Travel';
    case 'studio': return 'Studio';
  }
}

export function PathDetailClient({ path, languageName, sceneMastery, wordStats }: PathDetailClientProps) {
  const router = useRouter();
  const completedScenes = sceneMastery.filter(isSceneComplete).length;
  const totalScenes = sceneMastery.length;
  const overallProgress = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <IconButton label="Back to paths" onClick={() => router.push('/paths')} size="sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </IconButton>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground truncate">{path.title}</h1>
            <Badge variant={path.type === 'travel' ? 'tier' : 'default'}>
              {tierLabel(path.type)}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary">{languageName}</p>
        </div>
      </div>

      {/* Overall progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">
            {completedScenes}/{totalScenes} scenes complete
          </p>
          <p className="text-xs text-text-secondary">{overallProgress}%</p>
        </div>
        <ProgressBar value={overallProgress} accentColor="bg-accent-id" height="md" />
        <p className="text-xs text-text-secondary mt-2">
          {wordStats.words_learned}/{wordStats.total_words} words learned
        </p>
      </Card>

      {/* Path Complete Celebration */}
      {overallProgress === 100 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <div className="text-center py-2">
            <div className="text-2xl mb-1">&#10003;</div>
            <h3 className="text-lg font-semibold text-foreground">Path Complete!</h3>
            <p className="text-sm text-text-secondary mt-1 mb-4">
              You&apos;ve completed {path.title} &mdash; {wordStats.words_learned} words mastered across {totalScenes} scenes.
            </p>
            <div className="flex gap-2 justify-center">
              <Button href="/tutor?mode=word_review" size="sm">Review Path Words</Button>
              <Button href="/paths" variant="secondary" size="sm">Explore More Paths</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Journey Map */}
      <PathJourneyMap sceneMastery={sceneMastery} pathId={path.id} />
    </div>
  );
}
