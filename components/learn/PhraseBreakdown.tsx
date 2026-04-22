'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { MnemonicImage } from '@/components/shared/MnemonicImage';
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

      {/* Phrase-level composite mnemonic */}
      <div className="my-4 px-2" onClick={(e) => e.stopPropagation()}>
        <MnemonicImage
          src={phrase.composite_image_url}
          alt={phrase.text_en}
          variant="phrase-word"
          className="max-h-[200px]"
          fallback={
            <div className="rounded-lg bg-gradient-to-br from-accent-id/15 to-surface-inset py-6 px-4 mx-auto max-w-sm">
              <p className="text-lg font-bold text-accent-id">{phrase.text_target}</p>
              <p className="text-sm text-foreground mt-1">{phrase.text_en}</p>
              <p className="text-xs text-text-secondary mt-3">Visual coming soon</p>
            </div>
          }
        />
      </div>
      {phrase.phrase_bridge_sentence && (
        <p className="text-sm text-foreground italic px-4 mb-2 whitespace-nowrap overflow-hidden text-ellipsis" onClick={(e) => e.stopPropagation()}>
          {renderBridgeSentence(phrase.phrase_bridge_sentence)}
        </p>
      )}

      <p className="text-xs text-text-secondary mt-4 mb-2">Tap a word for its memory hook</p>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {phrase.words.map((word) => {
          const isExpanded = expandedWordId === word.word_id;
          return (
            <button
              key={word.word_id}
              onClick={(e) => handleChipClick(e, word)}
              className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border cursor-pointer transition-all text-sm ${
                isExpanded
                  ? 'border-accent-id bg-accent-id/10 text-accent-id'
                  : 'border-card-border bg-card-surface hover:bg-surface-inset'
              }`}
            >
              <span className="w-7 h-7 flex-shrink-0 overflow-hidden rounded-full bg-surface-inset flex items-center justify-center">
                <MnemonicImage
                  src={word.image_url}
                  alt=""
                  variant="thumb"
                  keyword={word.word_text}
                  className="!w-7 !h-7 !rounded-full"
                  fallback={
                    <span className="w-7 h-7 rounded-full bg-card-border/40 flex items-center justify-center text-[10px] text-text-secondary">
                      {word.word_text.charAt(0).toUpperCase()}
                    </span>
                  }
                />
              </span>
              <span className="font-medium">{word.word_text}</span>
            </button>
          );
        })}
      </div>

      {expandedWord && (
        <div className="animate-slide-up px-4 py-3 rounded-lg bg-surface-inset mx-auto max-w-sm mb-4" onClick={(e) => e.stopPropagation()}>
          {expandedWord.keyword_text ? (
            <>
              <div className="mb-2">
                <MnemonicImage
                  src={expandedWord.image_url}
                  alt={expandedWord.keyword_text}
                  variant="phrase-word"
                  keyword={expandedWord.keyword_text}
                  fallback={
                    <div className="rounded-lg bg-gradient-to-br from-accent-id/10 to-surface-inset py-4 px-3 mx-auto">
                      <p className="text-lg font-bold text-accent-id">&ldquo;{expandedWord.keyword_text}&rdquo;</p>
                    </div>
                  }
                />
              </div>
              <p className="text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                <span className="font-bold text-accent-id">{expandedWord.word_text}</span>
                {' '}sounds like &ldquo;{expandedWord.keyword_text}&rdquo;
              </p>
              {expandedWord.bridge_sentence && (
                <p className="text-sm text-foreground italic mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
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
