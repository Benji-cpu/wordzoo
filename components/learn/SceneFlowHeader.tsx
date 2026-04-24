'use client';

import { IconButton } from '@/components/ui/IconButton';
import { habitatFromLanguageCode, type HabitatLanguage } from '@/lib/utils/language-habitat';

// 5-phase flow post-Phase-0 (patterns / affixes were removed).
const PHASE_LABELS = ['Intro', 'Dialogue', 'Phrases', 'Vocab', 'Summary'] as const;
const PHASE_KEYS = ['scene-intro', 'dialogue', 'phrases', 'vocabulary', 'summary'] as const;

const HABITAT_CSS: Record<HabitatLanguage, string> = {
  default: 'var(--habitat-default)',
  indonesian: 'var(--habitat-indonesian)',
  spanish: 'var(--habitat-spanish)',
  japanese: 'var(--habitat-japanese)',
};

const ACCENT_CSS: Record<HabitatLanguage, string> = {
  default: 'var(--accent-indonesian)',
  indonesian: 'var(--accent-indonesian)',
  spanish: 'var(--accent-spanish)',
  japanese: 'var(--accent-japanese)',
};

interface SceneFlowHeaderProps {
  title: string;
  description?: string | null;
  currentPhase: string;
  phaseProgress?: number;
  onBack: () => void;
  sceneNumber?: number;
  totalScenes?: number;
  /** BCP-47 language code for the current scene — drives the accent band + pip colour. */
  languageCode?: string | null;
}

export function SceneFlowHeader({
  title,
  description,
  currentPhase,
  phaseProgress = 0,
  onBack,
  sceneNumber,
  totalScenes,
  languageCode,
}: SceneFlowHeaderProps) {
  // Legacy 'patterns' / 'affixes' rows forward-normalise to 'summary' (phase-0 invariant).
  const normalisedPhase =
    currentPhase === 'patterns' || currentPhase === 'affixes' || currentPhase === 'conversation'
      ? 'summary'
      : currentPhase;
  const currentIdx = PHASE_KEYS.indexOf(normalisedPhase as (typeof PHASE_KEYS)[number]);
  const positionPrefix = sceneNumber && totalScenes ? `Scene ${sceneNumber}/${totalScenes}: ` : '';

  const habitat = habitatFromLanguageCode(languageCode);
  const gradient = HABITAT_CSS[habitat];
  const accent = ACCENT_CSS[habitat];

  return (
    <div className="mb-2 md:mb-6">
      {/* Language-accent band — thin habitat stripe that signals the language context */}
      <div
        aria-hidden
        className="h-[3px] w-full rounded-full mb-3"
        style={{ background: gradient }}
      />

      <div className="flex items-center gap-3 mb-2">
        <IconButton label="Go back" onClick={onBack} size="sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </IconButton>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[color:var(--foreground)] truncate">
            {positionPrefix}
            {title}{' '}
            <span className="text-[color:var(--text-secondary)] font-semibold">
              &middot; {PHASE_LABELS[currentIdx >= 0 ? currentIdx : 0]}
            </span>
          </p>
          {description && (
            <p className="text-xs text-[color:var(--text-secondary)] font-semibold truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-1.5">
        {PHASE_KEYS.map((key, i) => {
          if (i < currentIdx) {
            return (
              <div
                key={key}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{ background: accent }}
              />
            );
          }
          if (i === currentIdx) {
            return (
              <div
                key={key}
                className="h-1.5 flex-1 rounded-full bg-[color:var(--surface-inset)] overflow-hidden"
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(phaseProgress * 100, 5)}%`,
                    background: accent,
                  }}
                />
              </div>
            );
          }
          return (
            <div
              key={key}
              className="h-1.5 flex-1 rounded-full bg-[color:var(--surface-inset)] transition-all duration-300"
            />
          );
        })}
      </div>
    </div>
  );
}
