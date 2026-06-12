'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { MnemonicImage } from '@/components/shared/MnemonicImage';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { playWordPronunciation } from '@/lib/audio';
import type { ScenePhraseWithMnemonics, PhraseWordMnemonic } from '@/types/database';
import type { SupportedLanguageCode } from '@/types/audio';

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
  onContinue?: () => void;
  /** Target language code — lets word taps speak via TTS when no seeded audio exists. */
  languageCode?: SupportedLanguageCode;
  /** When true, renders without the outer Card wrapper and without the tap-to-continue
   *  affordance — for embedding inside another surface like PhraseQuiz. */
  embedded?: boolean;
}

export function PhraseBreakdown({ phrase, onContinue, languageCode, embedded = false }: PhraseBreakdownProps) {
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
  const [hasExpandedAny, setHasExpandedAny] = useState(false);
  const expandedPanelRef = useRef<HTMLDivElement>(null);

  const expandedWord = phrase.words.find((w) => w.word_id === expandedWordId) ?? null;

  const handleChipClick = (e: React.MouseEvent, word: PhraseWordMnemonic) => {
    e.stopPropagation();
    const expanding = expandedWordId !== word.word_id;
    setExpandedWordId(expanding ? word.word_id : null);
    setHasExpandedAny(true);
    if (expanding) {
      // Speak the word the moment its memory hook opens (chip tap is the unlock gesture)
      playWordPronunciation(word.word_id, { text: word.word_text, languageCode }).catch(() => {});
      // Keep the expanded panel in view on small screens
      requestAnimationFrame(() => {
        expandedPanelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  };

  const inner = (
    <>
      {!embedded && (
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Key Phrase</p>
      )}

      <h2 className="text-2xl font-bold text-accent-id mb-1">{phrase.text_target}</h2>
      <p className="text-lg text-foreground mb-1">{phrase.text_en}</p>

      {/* Phrase-level composite mnemonic — shrinks while a word hook is open */}
      <div className="my-2 px-2" onClick={(e) => e.stopPropagation()}>
        <MnemonicImage
          src={phrase.composite_image_url}
          alt={phrase.text_en}
          variant="phrase-word"
          className={expandedWord ? 'max-h-[72px]' : 'max-h-[140px]'}
          fallback={
            <div className="rounded-lg bg-gradient-to-br from-accent-id/15 to-surface-inset py-4 px-4 mx-auto max-w-sm">
              <p className="text-lg font-bold text-accent-id">{phrase.text_target}</p>
              <p className="text-sm text-foreground mt-1">{phrase.text_en}</p>
            </div>
          }
        />
      </div>
      {phrase.phrase_bridge_sentence && (
        <p className="text-sm text-foreground italic px-4 mb-2" onClick={(e) => e.stopPropagation()}>
          {renderBridgeSentence(phrase.phrase_bridge_sentence)}
        </p>
      )}

      <p className="text-xs text-text-secondary mt-2 mb-2">Tap a word for its memory hook</p>

      <div className="flex flex-wrap gap-2 justify-center mb-2">
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
        <div ref={expandedPanelRef} className="animate-slide-up px-4 py-2 rounded-lg bg-surface-inset mx-auto max-w-sm mb-2" onClick={(e) => e.stopPropagation()}>
          {expandedWord.keyword_text ? (
            <>
              <div className="mb-2">
                <MnemonicImage
                  src={expandedWord.image_url}
                  alt={expandedWord.keyword_text}
                  variant="phrase-word"
                  keyword={expandedWord.keyword_text}
                  className="max-h-[110px]"
                  fallback={
                    <div className="rounded-lg bg-gradient-to-br from-accent-id/10 to-surface-inset py-3 px-3 mx-auto">
                      <p className="text-lg font-bold text-accent-id">&ldquo;{expandedWord.keyword_text}&rdquo;</p>
                    </div>
                  }
                />
              </div>
              <p className="text-sm text-foreground inline-flex items-center gap-0.5 flex-wrap justify-center">
                <span className="font-bold text-accent-id">{expandedWord.word_text}</span>
                {' '}sounds like &ldquo;{expandedWord.keyword_text}&rdquo;
                <PronunciationButton
                  wordId={expandedWord.word_id}
                  text={expandedWord.word_text}
                  languageCode={languageCode}
                  size={14}
                  className="-my-1 p-1"
                />
              </p>
              {expandedWord.bridge_sentence && (
                <p className="text-sm text-foreground italic mt-1">
                  {renderBridgeSentence(expandedWord.bridge_sentence)}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-base font-bold text-accent-id inline-flex items-center gap-0.5">
                {expandedWord.word_text}
                <PronunciationButton
                  wordId={expandedWord.word_id}
                  text={expandedWord.word_text}
                  languageCode={languageCode}
                  size={14}
                  className="-my-1 p-1"
                />
              </p>
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

    </>
  );

  if (embedded) {
    return (
      <div className="text-center py-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {inner}
      </div>
    );
  }

  return (
    <Card className="text-center py-5 animate-slide-up">
      {inner}
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 w-full rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold py-3.5 shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-indonesian)_35%,transparent)] active:scale-[0.97] transition-transform"
        >
          Continue →
        </button>
      )}
    </Card>
  );
}
