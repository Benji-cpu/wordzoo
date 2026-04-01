'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <p className="text-3xl mb-2">🎉</p>
        <h2 className="text-xl font-bold text-foreground">Scene Complete!</h2>
        <p className="text-sm text-text-secondary mt-1">{sceneTitle}</p>
        {sceneDescription && (
          <p className="text-xs text-text-secondary mt-0.5">{sceneDescription}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {words.map(({ word, mnemonic }) => (
          <Card key={word.id} className="text-center py-3">
            <p className="text-lg font-bold text-accent-id">{word.text}</p>
            <p className="text-sm text-text-secondary">{word.meaning_en}</p>
            {mnemonic && (
              <p className="text-xs text-text-secondary mt-1 truncate px-1">
                &ldquo;{mnemonic.keyword_text}&rdquo;
              </p>
            )}
          </Card>
        ))}
      </div>

      {(() => {
        const returnTo = nextScene
          ? `/learn/${nextScene.id}`
          : pathId
            ? `/paths/${pathId}`
            : '/';
        const tutorHref = sceneId
          ? `/tutor?mode=guided_conversation&sceneId=${sceneId}&returnTo=${encodeURIComponent(returnTo)}`
          : '/tutor?mode=free_chat';
        return (
          <Link
            href={tutorHref}
            className="block rounded-xl bg-accent-default/5 border border-accent-default/15 p-4 mb-4 hover:bg-accent-default/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-default flex-shrink-0">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">Practice with Tutor</p>
                <p className="text-xs text-text-secondary">Have a guided conversation about this scene</p>
              </div>
            </div>
          </Link>
        );
      })()}

      {showUpgrade && (
        <div className="mb-4">
          <UpgradePrompt feature="new_word" compact />
        </div>
      )}

      {nextScene ? (
        <div className="space-y-3">
          <Link href={`/learn/${nextScene.id}`} className="block">
            <Button className="w-full">
              Next: {nextScene.title}{nextScene.description ? ` — ${nextScene.description}` : ''} →
            </Button>
          </Link>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push('/')}>
              Dashboard
            </Button>
            {pathId && (
              <Link href={`/paths/${pathId}`} className="flex-1">
                <Button variant="secondary" className="w-full">All Scenes</Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pathId && (
            <div className="text-center mb-2">
              <p className="text-sm font-medium text-accent-id">Path Complete!</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push('/')}>
              Dashboard
            </Button>
            {pathId && (
              <Link href={`/paths/${pathId}`} className="flex-1">
                <Button variant="secondary" className="w-full">View Path</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
