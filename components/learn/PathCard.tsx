import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import type { Path } from '@/types/database';

interface PathCardProps {
  path: Path;
  wordCount: number;
  wordsCompleted: number;
  progress: number;
  scenesCompleted?: number;
  totalScenes?: number;
  nextSceneId?: string | null;
}

function tierLabel(type: Path['type']): string {
  switch (type) {
    case 'premade': return 'Premade';
    case 'custom': return 'Custom';
    case 'travel': return 'Travel';
    case 'studio': return 'Studio';
  }
}

export function PathCard({ path, wordCount, wordsCompleted, progress, scenesCompleted, totalScenes, nextSceneId }: PathCardProps) {
  return (
    <Card className="animate-fade-in relative">
      <Link
        href={`/paths/${path.id}`}
        aria-label={path.title}
        className="absolute inset-0 z-0 rounded-[inherit]"
      />
      <div className="relative z-10 pointer-events-none">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="text-base font-semibold text-foreground min-w-0 truncate">{path.title}</h3>
          <Badge variant={path.type === 'travel' ? 'tier' : 'default'}>
            {tierLabel(path.type)}
          </Badge>
        </div>
        {path.description && (
          <p className="text-sm text-text-secondary mb-3">{path.description}</p>
        )}
        <ProgressBar value={progress} accentColor="bg-accent-id" height="sm" />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-text-secondary">
            {totalScenes != null && scenesCompleted != null
              ? `${scenesCompleted}/${totalScenes} scenes · ${wordsCompleted}/${wordCount} words`
              : `${wordsCompleted}/${wordCount} words`}
          </p>
          {nextSceneId && progress < 100 && (
            <Link
              href={`/learn/${nextSceneId}`}
              className="pointer-events-auto text-xs font-medium text-accent-id hover:text-accent-id/80 transition-colors"
            >
              Continue &rarr;
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
