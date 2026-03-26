import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

const PHASE_LABELS: Record<string, string> = {
  dialogue: 'Dialogue',
  phrases: 'Phrases',
  vocabulary: 'Vocabulary',
  patterns: 'Patterns',
  conversation: 'Conversation',
  summary: 'Summary',
};

interface ContinueLearningCardProps {
  pathTitle: string;
  sceneTitle: string;
  sceneId: string;
  progress: number;
  currentPhase?: string | null;
}

export function ContinueLearningCard({
  pathTitle,
  sceneTitle,
  sceneId,
  progress,
  currentPhase,
}: ContinueLearningCardProps) {
  return (
    <Link href={`/learn/${sceneId}`} className="block">
      <Card className="animate-fade-in hover:border-accent-id/30 transition-colors">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
          {pathTitle}
        </p>
        <h3 className="text-base font-semibold text-foreground mb-2">
          {sceneTitle}
        </h3>
        <ProgressBar value={progress} accentColor="bg-accent-id" height="md" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-text-secondary">
            {progress}% complete
            {currentPhase && progress < 100 && (
              <span className="text-text-tertiary"> · {PHASE_LABELS[currentPhase] ?? currentPhase}</span>
            )}
          </span>
          <span className="text-sm font-medium text-accent-id">
            Continue →
          </span>
        </div>
      </Card>
    </Link>
  );
}
