import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MnemonicImage } from '@/components/shared/MnemonicImage';

const PHASE_LABELS: Record<string, string> = {
  dialogue: 'Dialogue',
  phrases: 'Phrases',
  vocabulary: 'Vocabulary',
  patterns: 'Patterns',
  conversation: 'Conversation',
  summary: 'Summary',
};

interface SceneDot {
  id: string;
  completed: boolean;
}

interface ContinueLearningCardProps {
  sceneTitle: string;
  sceneId: string;
  progress: number;
  currentPhase?: string | null;
  sceneIndex: number;
  totalScenes: number;
  sceneDots: SceneDot[];
  anchorImageUrl?: string | null;
}

export function ContinueLearningCard({
  sceneTitle,
  sceneId,
  progress,
  currentPhase,
  sceneIndex,
  totalScenes,
  sceneDots,
  anchorImageUrl,
}: ContinueLearningCardProps) {
  // Show 3 dots around current scene
  const startIdx = Math.max(0, sceneIndex - 1);
  const endIdx = Math.min(sceneDots.length, startIdx + 3);
  const visibleDots = sceneDots.slice(startIdx, endIdx);

  return (
    <Link href={`/learn/${sceneId}`} className="block">
      <Card className="animate-fade-in hover:border-accent-id/30 transition-colors overflow-hidden !p-0">
        {anchorImageUrl && (
          <div className="w-full h-28 sm:h-36 overflow-hidden bg-surface-inset relative">
            <MnemonicImage
              src={anchorImageUrl}
              alt={sceneTitle}
              variant="community"
              fallback={null}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card-surface/80 via-transparent to-transparent pointer-events-none" />
          </div>
        )}
        <div className="p-4">
        {/* Scene position + dot map */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-text-secondary">
            Scene {sceneIndex + 1} of {totalScenes}
          </p>
          <div className="flex items-center gap-1">
            {startIdx > 0 && (
              <span className="text-text-tertiary text-[10px]">...</span>
            )}
            {visibleDots.map((dot, i) => {
              const actualIdx = startIdx + i;
              const isCurrent = actualIdx === sceneIndex;
              return (
                <div
                  key={dot.id}
                  className={`rounded-full shrink-0 ${
                    dot.completed
                      ? 'w-2 h-2 bg-green-400'
                      : isCurrent
                      ? 'w-2.5 h-2.5 bg-accent-id shadow-[0_0_4px_rgba(var(--accent-id-rgb,99,102,241),0.5)]'
                      : 'w-2 h-2 bg-card-border'
                  }`}
                />
              );
            })}
            {endIdx < sceneDots.length && (
              <span className="text-text-tertiary text-[10px]">...</span>
            )}
          </div>
        </div>

        <h3 className="text-base font-semibold text-foreground mb-2">
          {sceneTitle}
        </h3>

        <ProgressBar value={progress} accentColor="bg-accent-id" height="md" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-text-secondary">
            {currentPhase && progress < 100 && (
              <>{PHASE_LABELS[currentPhase] ?? currentPhase}</>
            )}
            {(!currentPhase || progress >= 100) && <>{progress}%</>}
          </span>
          <span className="text-sm font-medium text-accent-id">
            Continue →
          </span>
        </div>
        </div>
      </Card>
    </Link>
  );
}
