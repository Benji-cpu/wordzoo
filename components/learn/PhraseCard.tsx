'use client';

import { Card } from '@/components/ui/Card';
import type { ScenePhrase } from '@/types/database';

interface PhraseCardProps {
  phrase: ScenePhrase;
  onContinue: () => void;
}

export function PhraseCard({ phrase, onContinue }: PhraseCardProps) {
  return (
    <Card className="text-center py-8 animate-slide-up" onClick={onContinue}>
      <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Key Phrase</p>
      <h2 className="text-3xl font-bold text-accent-id mb-2">{phrase.text_target}</h2>
      <p className="text-lg text-foreground mb-2">{phrase.text_en}</p>
      {phrase.literal_translation && (
        <p className="text-sm text-text-secondary italic mb-3">
          Literally: &ldquo;{phrase.literal_translation}&rdquo;
        </p>
      )}
      {phrase.usage_note && (
        <div className="bg-white/5 rounded-lg px-4 py-3 mx-auto max-w-sm mt-2">
          <p className="text-sm text-text-secondary">{phrase.usage_note}</p>
        </div>
      )}
      <p className="text-sm text-text-secondary mt-6">Tap to continue</p>
    </Card>
  );
}
