'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { isSceneComplete, sceneProgress } from '@/lib/utils/scene-progress';
import type { SceneMasteryRow } from '@/lib/db/queries';

interface PathProgressWidgetProps {
  sceneMastery: SceneMasteryRow[];
  pathId: string;
  pathTitle: string;
  currentSceneIndex: number;
}

export function PathProgressWidget({ sceneMastery, pathId, pathTitle, currentSceneIndex }: PathProgressWidgetProps) {
  const total = sceneMastery.length;
  if (total === 0) return null;

  const currentScene = sceneMastery[currentSceneIndex];
  const progress = currentScene ? sceneProgress(currentScene) : 0;

  // Show dots: prev, current, next (3 visible dots with context)
  const startIdx = Math.max(0, currentSceneIndex - 1);
  const endIdx = Math.min(total, startIdx + 3);
  const visibleScenes = sceneMastery.slice(startIdx, endIdx);

  return (
    <Link href={`/paths/${pathId}`} className="block">
      <Card className="!p-3 hover:border-accent-id/30 transition-colors">
        <div className="flex items-center gap-3">
          {/* Mini dot map */}
          <div className="flex items-center gap-1.5">
            {startIdx > 0 && (
              <span className="text-text-tertiary text-xs">...</span>
            )}
            {visibleScenes.map((s, i) => {
              const actualIdx = startIdx + i;
              const complete = isSceneComplete(s);
              const isCurrent = actualIdx === currentSceneIndex;
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className={`rounded-full shrink-0 ${
                    complete
                      ? 'w-2.5 h-2.5 bg-green-400'
                      : isCurrent
                      ? 'w-3.5 h-3.5 bg-accent-id shadow-[0_0_6px_rgba(var(--accent-id-rgb,99,102,241),0.5)]'
                      : 'w-2.5 h-2.5 bg-card-border'
                  }`} />
                  {i < visibleScenes.length - 1 && (
                    <div className={`w-4 h-0.5 ${
                      complete ? 'bg-green-400/50' : 'bg-surface-inset'
                    }`} />
                  )}
                </div>
              );
            })}
            {endIdx < total && (
              <span className="text-text-tertiary text-xs ml-1">...</span>
            )}
          </div>

          {/* Position text */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-secondary truncate">
              Scene {currentSceneIndex + 1} of {total} — {currentScene?.title}
            </p>
            {/* Mini progress bar */}
            <div className="mt-1 h-1 rounded-full bg-surface-inset overflow-hidden">
              <div
                className="h-full bg-accent-id rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Arrow */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
