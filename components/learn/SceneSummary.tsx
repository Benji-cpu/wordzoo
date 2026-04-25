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
    <div className="flex flex-col flex-1 min-h-0 pt-2">
      {/* Hero celebration band — compact so the CTAs stay above the fold on mobile */}
      <div className="relative text-center mb-3 animate-spring-in">
        <div className="flex justify-center mb-2">
          <Fox pose="celebrating" size="md" aria-label="Scene complete!" />
        </div>
        <Celebration active variant="scene-complete" />
        <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--accent-indonesian)] mb-1">
          {sceneNumber && totalScenes ? `Scene ${sceneNumber} of ${totalScenes} complete` : 'Scene complete!'}
        </p>
        <h2 className="text-lg font-extrabold tracking-tight text-[color:var(--foreground)] leading-tight">
          {sceneTitle}
        </h2>
        {sessionEarned > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[color:var(--color-fox-soft)] text-[color:var(--color-fox-deep)] dark:text-[color:var(--color-fox-primary)] text-[12px] font-extrabold">
            <span aria-hidden>✨</span>
            +{sessionEarned} XP
          </p>
        )}
      </div>

      <Card className="mb-3 py-3">
        <div className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[color:var(--text-secondary)] mb-2">
          {words.length} {words.length === 1 ? 'word' : 'words'} learned
        </div>
        <div className="flex flex-wrap gap-1.5">
          {words.map(({ word }) => {
            const isExpanded = expandedWordId === word.id;
            return (
              <button
                key={word.id}
                type="button"
                onClick={() =>
                  setExpandedWordId(isExpanded ? null : word.id)
                }
                className={`px-2.5 py-1 rounded-full text-[12.5px] font-bold transition-all ${
                  isExpanded
                    ? 'bg-[color:var(--accent-indonesian)] text-white'
                    : 'bg-[color:var(--color-fox-soft)] text-[color:var(--color-fox-deep)] dark:text-[color:var(--color-fox-primary)]'
                }`}
              >
                {word.text}
                {isExpanded && (
                  <>
                    <span className="opacity-85"> = {word.meaning_en}</span>
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
            );
          })}
        </div>
      </Card>

      {insight && onInsightDismiss && (
        <div className="mb-4">
          <InsightCard insight={insight} onDismiss={onInsightDismiss} />
        </div>
      )}

      <div className="flex-1" />

      {wordsLearnedToday > 0 && (
        <div className="mb-2">
          <PacingNudge
            wordsLearnedToday={wordsLearnedToday}
            scenesCompletedToday={scenesCompletedToday}
          />
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-2 pb-3">
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
