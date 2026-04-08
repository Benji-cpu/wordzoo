'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';

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
}

export function SceneSummary({ sceneTitle, sceneDescription, words, showUpgrade = false, nextScene, pathId, sceneId }: SceneSummaryProps) {
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  const returnTo = nextScene
    ? `/learn/${nextScene.id}`
    : pathId
      ? `/paths/${pathId}`
      : '/';
  const tutorHref = sceneId
    ? `/tutor?mode=guided_conversation&sceneId=${sceneId}&returnTo=${encodeURIComponent(returnTo)}`
    : '/tutor?mode=free_chat';

  const primaryHref = nextScene
    ? `/learn/${nextScene.id}`
    : pathId
      ? `/paths/${pathId}`
      : '/';
  const primaryLabel = nextScene
    ? `Next: ${nextScene.title} →`
    : pathId
      ? 'Path Complete! View Path →'
      : 'Back to Dashboard →';

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">🎉</p>
        <h2 className="text-xl font-bold text-foreground">Scene Complete!</h2>
        <p className="text-sm text-text-secondary mt-1">{sceneTitle}</p>
        {sceneDescription && (
          <p className="text-xs text-text-secondary mt-0.5">{sceneDescription}</p>
        )}
      </div>

      <Card className="mb-4">
        <div className="text-sm font-medium text-foreground mb-2">{words.length} words learned</div>
        <div className="flex flex-wrap gap-1.5">
          {words.map(({ word }) => (
            <button
              key={word.id}
              type="button"
              onClick={() => setExpandedWordId(expandedWordId === word.id ? null : word.id)}
              className="px-2 py-0.5 rounded-full bg-accent-default/10 text-accent-default text-xs font-medium transition-all"
            >
              {word.text}{expandedWordId === word.id && <span className="text-text-secondary"> = {word.meaning_en}</span>}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <Link href={tutorHref} className="block">
          <Button className="w-full">Practice with Tutor</Button>
        </Link>
        <Link href={primaryHref} className="block text-center text-sm text-text-secondary hover:text-foreground transition-colors">
          Skip — {primaryLabel}
        </Link>
      </div>

      {showUpgrade && (
        <div className="mt-4">
          <UpgradePrompt feature="new_word" compact />
        </div>
      )}
    </div>
  );
}
