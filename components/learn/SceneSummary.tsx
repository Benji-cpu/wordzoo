'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { MockWordWithMnemonic } from '@/lib/mocks/learning-data';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';

interface SceneSummaryProps {
  sceneTitle: string;
  words: MockWordWithMnemonic[];
  showUpgrade?: boolean;
}

export function SceneSummary({ sceneTitle, words, showUpgrade = false }: SceneSummaryProps) {
  const router = useRouter();

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <p className="text-3xl mb-2">🎉</p>
        <h2 className="text-xl font-bold text-foreground">Scene Complete!</h2>
        <p className="text-sm text-text-secondary mt-1">{sceneTitle}</p>
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

      {showUpgrade && (
        <div className="mb-4">
          <UpgradePrompt feature="new_word" compact />
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => router.push('/dashboard')}>
          Dashboard
        </Button>
        <Button className="flex-1" onClick={() => router.push('/review')}>
          Practice
        </Button>
      </div>
    </div>
  );
}
