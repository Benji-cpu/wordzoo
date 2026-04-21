'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { Celebration } from '@/components/ui/Celebration';
import { Fox } from '@/components/mascot/Fox';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';
import { PacingNudge, getPacingLevel } from '@/components/learn/PacingNudge';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { InsightCard } from '@/components/insights/InsightCard';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { useXP } from '@/lib/hooks/useXP';
import type { InsightDefinition } from '@/lib/insights/data';

interface SummaryWord {
  word: { id: string; text: string; meaning_en: string };
  mnemonic: { keyword_text: string } | null;
}

interface SceneSummaryProps {
  sceneTitle: string;
  sceneDescription?: string | null;
  words: SummaryWord[];
  showUpgrade?: boolean;
  nextScene?: { id: string; title: string; description?: string | null } | null;
  pathId?: string;
  sceneId?: string;
  sceneNumber?: number;
  totalScenes?: number;
  wordsLearnedToday?: number;
  scenesCompletedToday?: number;
  insight?: InsightDefinition;
  onInsightDismiss?: () => void;
}

export function SceneSummary({
  sceneTitle,
  sceneDescription,
  words,
  showUpgrade = false,
  nextScene,
  pathId,
  sceneId,
  sceneNumber,
  totalScenes,
  wordsLearnedToday = 0,
  scenesCompletedToday = 0,
  insight,
  onInsightDismiss,
}: SceneSummaryProps) {
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
  const { play } = useSound();
  const { trigger } = useHaptic();
  const { award, sessionEarned } = useXP();

  // Fire celebration once on mount
  useEffect(() => {
    play('scene-complete');
    trigger('celebrate');
    award('scene_complete');
    // award is stable within hook; intentional run-once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const returnTo = nextScene
    ? `/learn/${nextScene.id}`
    : pathId
      ? `/paths/${pathId}`
      : '/';
  const tutorHref = sceneId
    ? `/tutor?mode=guided_conversation&sceneId=${sceneId}&returnTo=${encodeURIComponent(returnTo)}`
    : '/tutor?mode=free_chat';

  const nextSceneHref = nextScene
    ? `/learn/${nextScene.id}`
    : pathId
      ? `/paths/${pathId}`
      : '/';
  const nextLabel = nextScene && sceneNumber && totalScenes
    ? `Next up: Scene ${sceneNumber + 1} — ${nextScene.title}`
    : nextScene
      ? `Next: ${nextScene.title}`
      : pathId
        ? 'Path Complete! View Path'
        : 'Back to Dashboard';

  const pacingLevel = getPacingLevel(wordsLearnedToday);
  const isEarlyScene = sceneNumber !== undefined && sceneNumber <= 3;

  return (
    <div className="flex flex-col flex-1 min-h-0 pt-4">
      {/* Hero celebration band */}
      <div className="relative text-center mb-6">
        <div className="flex justify-center mb-3">
          <Fox pose="celebrating" size="lg" aria-label="Scene complete!" />
        </div>
        <Celebration active variant="scene-complete" />
        <h2 className="text-2xl font-bold text-foreground animate-spring-in">
          {sceneNumber && totalScenes
            ? `Scene ${sceneNumber} of ${totalScenes} complete!`
            : 'Scene complete!'}
        </h2>
        <p className="text-sm text-text-secondary mt-1">{sceneTitle}</p>
        {sceneDescription && (
          <p className="text-xs text-text-secondary mt-1">{sceneDescription}</p>
        )}
        {sessionEarned > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-fox-soft)] text-[var(--color-fox-deep)] dark:text-[var(--color-fox-primary)] text-sm font-semibold">
            <span aria-hidden>✨</span>
            +{sessionEarned} XP earned
          </p>
        )}
      </div>

      <Card className="mb-6">
        <div className="text-sm font-medium text-foreground mb-2">
          {words.length} words learned
        </div>
        <div className="flex flex-wrap gap-1.5">
          {words.map(({ word }) => (
            <button
              key={word.id}
              type="button"
              onClick={() =>
                setExpandedWordId(expandedWordId === word.id ? null : word.id)
              }
              className="px-2 py-0.5 rounded-full bg-[var(--color-fox-soft)] text-[var(--color-fox-deep)] dark:text-[var(--color-fox-primary)] text-xs font-medium transition-all"
            >
              {word.text}
              {expandedWordId === word.id && (
                <>
                  <span className="text-text-secondary"> = {word.meaning_en}</span>
                  <span
                    className="inline-flex ml-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PronunciationButton
                      wordId={word.id}
                      text={word.text}
                      size={12}
                      className="p-0.5 -my-0.5"
                    />
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </Card>

      {insight && onInsightDismiss && (
        <div className="mb-4">
          <InsightCard insight={insight} onDismiss={onInsightDismiss} />
        </div>
      )}

      <div className="flex-1" />

      {wordsLearnedToday > 0 && (
        <div className="mb-4">
          <PacingNudge
            wordsLearnedToday={wordsLearnedToday}
            scenesCompletedToday={scenesCompletedToday}
          />
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3 pb-4">
        {isEarlyScene ? (
          <>
            <Link href={nextSceneHref} className="block">
              <ThumbButton size="lg" variant="primary">
                {nextLabel} →
              </ThumbButton>
            </Link>
            <Link
              href={tutorHref}
              className="block text-center text-sm text-text-secondary hover:text-foreground transition-colors"
            >
              Or practice with Tutor →
            </Link>
          </>
        ) : pacingLevel === 'green' ? (
          <>
            <Link href={tutorHref} className="block">
              <ThumbButton size="lg" variant="primary">
                Practice with Tutor
              </ThumbButton>
            </Link>
            <Link
              href={nextSceneHref}
              className="block text-center text-sm text-text-secondary hover:text-foreground transition-colors"
            >
              Skip — {nextLabel} →
            </Link>
          </>
        ) : (
          <>
            <Link href="/review" className="block">
              <ThumbButton size="lg" variant="primary">
                Review Now
              </ThumbButton>
            </Link>
            <Link href={tutorHref} className="block">
              <Button variant="secondary" className="w-full">
                Practice with Tutor
              </Button>
            </Link>
            <Link
              href={nextSceneHref}
              className="block text-center text-sm text-text-secondary hover:text-foreground transition-colors"
            >
              {nextLabel} →
            </Link>
          </>
        )}
      </div>

      {showUpgrade && (
        <div className="mt-4">
          <UpgradePrompt feature="new_word" compact />
        </div>
      )}
    </div>
  );
}
