'use client';

import { IconButton } from '@/components/ui/IconButton';

const PHASE_LABELS = ['Intro', 'Dialogue', 'Phrases', 'Vocab', 'Patterns', 'Affixes', 'Summary'] as const;
const PHASE_KEYS = ['scene-intro', 'dialogue', 'phrases', 'vocabulary', 'patterns', 'affixes', 'summary'] as const;

interface SceneFlowHeaderProps {
  title: string;
  description?: string | null;
  currentPhase: string;
  phaseProgress?: number;
  onBack: () => void;
  sceneNumber?: number;
  totalScenes?: number;
}

export function SceneFlowHeader({ title, description, currentPhase, phaseProgress = 0, onBack, sceneNumber, totalScenes }: SceneFlowHeaderProps) {
  const currentIdx = PHASE_KEYS.indexOf(currentPhase as typeof PHASE_KEYS[number]);
  const positionPrefix = sceneNumber && totalScenes ? `Scene ${sceneNumber}/${totalScenes}: ` : '';

  return (
    <div className="mb-2 md:mb-6">
      <div className="flex items-center gap-3 mb-2">
        <IconButton label="Go back" onClick={onBack} size="sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </IconButton>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {positionPrefix}{title} <span className="text-text-secondary font-normal">&middot; {PHASE_LABELS[currentIdx >= 0 ? currentIdx : 0]}</span>
          </p>
          {description && (
            <p className="text-xs text-text-secondary truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-1.5">
        {PHASE_KEYS.map((key, i) => {
          if (i < currentIdx) {
            // Past phase — fully filled
            return <div key={key} className="h-1.5 flex-1 rounded-full bg-accent-id transition-all duration-300" />;
          }
          if (i === currentIdx) {
            // Current phase — partially filled
            return (
              <div key={key} className="h-1.5 flex-1 rounded-full bg-surface-inset overflow-hidden">
                <div
                  className="h-full bg-accent-id rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(phaseProgress * 100, 5)}%` }}
                />
              </div>
            );
          }
          // Future phase — empty
          return <div key={key} className="h-1.5 flex-1 rounded-full bg-surface-inset transition-all duration-300" />;
        })}
      </div>
    </div>
  );
}
