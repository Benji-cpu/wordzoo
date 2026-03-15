'use client';

import { Card } from '@/components/ui/Card';

interface WordCardProps {
  text: string;
  romanization?: string | null;
  meaningEn: string;
  partOfSpeech: string;
  onContinue: () => void;
}

export function WordCard({ text, romanization, meaningEn, partOfSpeech, onContinue }: WordCardProps) {
  return (
    <Card className="text-center py-12 animate-slide-up" onClick={onContinue}>
      <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">
        {partOfSpeech}
      </p>
      <h2 className="text-4xl font-bold text-accent-id mb-2">{text}</h2>
      {romanization && (
        <p className="text-lg text-text-secondary mb-4">{romanization}</p>
      )}
      <div className="w-12 h-px bg-card-border mx-auto my-4" />
      <p className="text-xl text-foreground">{meaningEn}</p>
      <p className="text-sm text-text-secondary mt-8">Tap to continue</p>
    </Card>
  );
}
