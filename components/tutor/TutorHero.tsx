'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TUTOR_MODES, MODE_LABELS } from '@/lib/tutor/modes';
import type { TutorRecommendation } from '@/app/api/tutor/recommendation/route';

interface TutorHeroProps {
  recommendation: TutorRecommendation | null;
  onSelect: (mode: string, scenario?: string) => void;
  onStartGuided?: (sceneId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function TutorHero({
  recommendation,
  onSelect,
  onStartGuided,
  disabled,
  isLoading,
}: TutorHeroProps) {
  const [showAllModes, setShowAllModes] = useState(false);
  const [scenario, setScenario] = useState('');

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
        <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
        <div className="h-11 bg-white/10 rounded-xl" />
      </Card>
    );
  }

  const rec = recommendation;
  const isFallback = !rec || rec.type === 'fallback';

  return (
    <div className="space-y-3">
      {/* Hero card */}
      {!isFallback && (
        <Card className="space-y-3">
          {rec.type === 'due_words' && (
            <>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                  {rec.dueWordCount} due
                </span>
              </div>
              <p className="text-foreground font-medium">
                You have {rec.dueWordCount} words due for review
              </p>
              <Button
                onClick={() => onSelect('word_review')}
                disabled={disabled}
                className="w-full"
              >
                {disabled ? 'Starting...' : 'Start Word Review'}
              </Button>
            </>
          )}

          {rec.type === 'continue_session' && (
            <>
              <p className="text-text-secondary text-sm">Pick up where you left off</p>
              <p className="text-foreground font-medium">
                Continue: {MODE_LABELS[rec.lastMode!] ?? rec.lastMode}
                {rec.lastScenario && (
                  <span className="text-text-secondary font-normal"> — {rec.lastScenario}</span>
                )}
              </p>
              <Button
                onClick={() => onSelect(rec.lastMode!, rec.lastScenario ?? undefined)}
                disabled={disabled}
                className="w-full"
              >
                {disabled ? 'Starting...' : 'Start'}
              </Button>
            </>
          )}

          {rec.type === 'next_scene' && (
            <>
              <p className="text-text-secondary text-sm">Next up on your path</p>
              <p className="text-foreground font-medium">{rec.sceneTitle}</p>
              <Button
                onClick={() => onStartGuided?.(rec.sceneId!)}
                disabled={disabled}
                className="w-full"
              >
                {disabled ? 'Starting...' : 'Start Guided Conversation'}
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Fallback heading */}
      {isFallback && (
        <p className="text-foreground font-medium text-lg">What would you like to practice?</p>
      )}

      {/* "or choose a different mode" toggle */}
      {!isFallback && (
        <button
          onClick={() => setShowAllModes((v) => !v)}
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          {showAllModes ? 'hide modes' : 'or choose a different mode →'}
        </button>
      )}

      {/* Compact mode list */}
      {(isFallback || showAllModes) && (
        <div className="space-y-1">
          {TUTOR_MODES.map((mode) => (
            <div key={mode.id}>
              <button
                onClick={() => {
                  if (mode.hasScenario) {
                    // Toggle inline scenario input instead of immediately selecting
                    setScenario('');
                    setShowAllModes(true);
                    // Use a small trick: if already showing scenario for this mode, select it
                    const el = document.getElementById(`scenario-${mode.id}`);
                    if (el) {
                      el.focus();
                      return;
                    }
                  }
                  onSelect(mode.id);
                }}
                disabled={disabled}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-50"
              >
                <span className="text-lg shrink-0">{mode.icon}</span>
                <span className="text-foreground text-sm font-medium">{mode.label}</span>
              </button>

              {/* Inline scenario input for role_play */}
              {mode.hasScenario && (isFallback || showAllModes) && (
                <div className="pl-10 pr-3 pb-2 flex gap-2">
                  <input
                    id={`scenario-${mode.id}`}
                    type="text"
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="e.g. Ordering food at a restaurant"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSelect(mode.id, scenario || undefined);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-card-surface border border-card-border text-foreground text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-default"
                  />
                  <Button
                    size="sm"
                    onClick={() => onSelect(mode.id, scenario || undefined)}
                    disabled={disabled}
                  >
                    Go
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
