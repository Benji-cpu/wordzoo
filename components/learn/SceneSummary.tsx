'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';
import { PacingNudge, getPacingLevel } from '@/components/learn/PacingNudge';
import { PronunciationButton } from '@/components/audio/SpeakerButton';

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
}

export function SceneSummary({ sceneTitle, sceneDescription, words, showUpgrade = false, nextScene, pathId, sceneId, sceneNumber, totalScenes, wordsLearnedToday = 0, scenesCompletedToday = 0 }: SceneSummaryProps) {
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

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
    ? `Next up: Scene ${sceneNumber + 1} — ${nextScene.title} →`
    : nextScene
      ? `Next: ${nextScene.title} →`
      : pathId
        ? 'Path Complete! View Path →'
        : 'Back to Dashboard →';

  const pacingLevel = getPacingLevel(wordsLearnedToday);
  // Early scenes (1-3): user hasn't learned enough vocab for tutor to be useful
  const isEarlyScene = sceneNumber !== undefined && sceneNumber <= 3;

  return (
    <div className="animate-slide-up flex flex-col min-h-[70vh]">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-surface-inset flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-id">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {sceneNumber && totalScenes ? `Scene ${sceneNumber} of ${totalScenes} complete` : 'Scene complete'}
        </h2>
        <p className="text-sm text-text-secondary mt-1">{sceneTitle}</p>
        {sceneDescription && (
          <p className="text-xs text-text-secondary mt-1">{sceneDescription}</p>
        )}
      </div>

      <Card className="mb-6">
        <div className="text-sm font-medium text-foreground mb-2">{words.length} words learned</div>
        <div className="flex flex-wrap gap-1.5">
          {words.map(({ word }) => (
            <button
              key={word.id}
              type="button"
              onClick={() => setExpandedWordId(expandedWordId === word.id ? null : word.id)}
              className="px-2 py-0.5 rounded-full bg-accent-default/10 text-accent-default text-xs font-medium transition-all"
            >
              {word.text}
              {expandedWordId === word.id && (
                <>
                  <span className="text-text-secondary"> = {word.meaning_en}</span>
                  <span className="inline-flex ml-0.5" onClick={(e) => e.stopPropagation()}>
                    <PronunciationButton wordId={word.id} text={word.text} size={12} className="p-0.5 -my-0.5" />
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Spacer to distribute content vertically */}
      <div className="flex-1" />

      {/* Pacing nudge */}
      {wordsLearnedToday > 0 && (
        <div className="mb-6">
          <PacingNudge wordsLearnedToday={wordsLearnedToday} scenesCompletedToday={scenesCompletedToday} />
        </div>
      )}

      {/* CTAs — reorder based on scene number and pacing level */}
      <div className="space-y-3 pb-4">
        {isEarlyScene ? (
          <>
            <Link href={nextSceneHref} className="block">
              <Button className="w-full">{nextLabel}</Button>
            </Link>
            <Link href={tutorHref} className="block text-center text-sm text-text-secondary hover:text-foreground transition-colors">
              Or practice with Tutor →
            </Link>
          </>
        ) : pacingLevel === 'green' ? (
          <>
            <Link href={tutorHref} className="block">
              <Button className="w-full">Practice with Tutor</Button>
            </Link>
            <Link href={nextSceneHref} className="block text-center text-sm text-text-secondary hover:text-foreground transition-colors">
              Skip — {nextLabel}
            </Link>
          </>
        ) : (
          <>
            <Link href="/review" className="block">
              <Button className="w-full">Review Now</Button>
            </Link>
            <Link href={tutorHref} className="block">
              <Button variant="secondary" className="w-full">Practice with Tutor</Button>
            </Link>
            <Link href={nextSceneHref} className="block text-center text-sm text-text-secondary hover:text-foreground transition-colors">
              {nextLabel}
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
