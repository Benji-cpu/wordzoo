import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface ContinueLearningCardProps {
  pathTitle: string;
  sceneTitle: string;
  sceneId: string;
  progress: number;
}

export function ContinueLearningCard({
  pathTitle,
  sceneTitle,
  sceneId,
  progress,
}: ContinueLearningCardProps) {
  return (
    <Link href={`/learn/${sceneId}`} className="block">
      <Card className="animate-fade-in hover:border-accent-id/30 transition-colors">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
          {pathTitle}
        </p>
        <h3 className="text-lg font-semibold text-foreground mb-3">
          {sceneTitle}
        </h3>
        <ProgressBar value={progress} accentColor="bg-accent-id" height="md" />
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-text-secondary">{progress}% complete</span>
          <span className="text-sm font-medium text-accent-id">
            Continue →
          </span>
        </div>
      </Card>
    </Link>
  );
}
