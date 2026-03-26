'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import type { ScenePhraseWithMnemonics, PhraseWordMnemonic } from '@/types/database';

function renderBridgeSentence(sentence: string) {
  const parts = sentence.split(/\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/);
  return parts.map((part, i) =>
    /^[A-Z]{2,}(?:\s+[A-Z]{2,})*$/.test(part) ? (
      <span key={i} className="font-bold text-accent-id not-italic">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface PhraseBreakdownProps {
  phrase: ScenePhraseWithMnemonics;
  onContinue: () => void;
}

export function PhraseBreakdown({ phrase, onContinue }: PhraseBreakdownProps) {
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
  const [hasExpandedAny, setHasExpandedAny] = useState(false);

  const expandedWord = phrase.words.find((w) => w.word_id === expandedWordId) ?? null;

  const handleChipClick = (e: React.MouseEvent, word: PhraseWordMnemonic) => {
    e.stopPropagation();
    setExpandedWordId((prev) => (prev === word.word_id ? null : word.word_id));
    setHasExpandedAny(true);
  };

  return (
    <Card className="text-center py-8 animate-slide-up" onClick={onContinue}>
      <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Key Phrase</p>

      <h2 className="text-3xl font-bold text-accent-id mb-2">{phrase.text_target}</h2>
      <p className="text-lg text-foreground mb-2">{phrase.text_en}</p>

      <p className="text-xs text-text-secondary mt-4 mb-2">Tap a word to explore</p>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {phrase.words.map((word) => {
          const isExpanded = expandedWordId === word.word_id;
          return (
            <button
              key={word.word_id}
              onClick={(e) => handleChipClick(e, word)}
              className={`px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm ${
                isExpanded
                  ? 'border-accent-id bg-accent-id/10 text-accent-id'
                  : 'border-card-border bg-card-surface hover:bg-white/10'
              }`}
            >
              {word.word_text}
            </button>
          );
        })}
      </div>

      {expandedWord && (
        <div className="animate-slide-up px-4 py-3 rounded-lg bg-white/5 mx-auto max-w-sm mb-4" onClick={(e) => e.stopPropagation()}>
          {expandedWord.keyword_text ? (
            <>
              {expandedWord.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={expandedWord.image_url}
                  alt={expandedWord.keyword_text}
                  className="max-h-[150px] rounded-lg object-cover mx-auto mb-2"
                />
              )}
              <p className="text-sm text-foreground">
                <span className="font-bold text-accent-id">{expandedWord.word_text}</span>
                {' '}sounds like &ldquo;{expandedWord.keyword_text}&rdquo;
              </p>
              {expandedWord.bridge_sentence && (
                <p className="text-sm text-foreground italic mt-1">
                  {renderBridgeSentence(expandedWord.bridge_sentence)}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-base font-bold text-accent-id">{expandedWord.word_text}</p>
              <p className="text-sm text-foreground">{expandedWord.word_en}</p>
              <p className="text-xs text-text-secondary">{expandedWord.part_of_speech}</p>
            </>
          )}
        </div>
      )}

      {hasExpandedAny && phrase.literal_translation && (
        <p className="text-sm text-text-secondary italic animate-fade-in mb-2" onClick={(e) => e.stopPropagation()}>
          Literally &ldquo;{phrase.literal_translation}&rdquo;
          {phrase.usage_note && <> &mdash; {phrase.usage_note}</>}
        </p>
      )}

      <p className="text-sm text-text-secondary mt-6">Tap to continue</p>
    </Card>
  );
}
