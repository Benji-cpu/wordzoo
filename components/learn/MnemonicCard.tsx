'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { ShareButton } from '@/components/community/ShareButton';
import { FeedbackButtons } from '@/components/learn/FeedbackButtons';
import { PronunciationButton } from '@/components/audio/PronunciationButton';
import { playWordPronunciation } from '@/lib/audio/pronunciation';

function renderBridgeSentence(sentence: string) {
  // Split on ALL-CAPS words (2+ letters) and render them highlighted
  const parts = sentence.split(/\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/);
  return parts.map((part, i) =>
    /^[A-Z]{2,}(?:\s+[A-Z]{2,})*$/.test(part) ? (
      <span key={i} className="font-bold text-accent-id not-italic">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface MnemonicCardProps {
  wordText: string;
  keyword: string;
  sceneDescription: string;
  bridgeSentence: string | null;
  imageUrl: string | null;
  mnemonicId?: string;
  wordId?: string;
  meaningEn?: string;
  languageName?: string;
  onContinue: () => void;
}

export function MnemonicCard({
  wordText,
  keyword,
  sceneDescription,
  bridgeSentence,
  imageUrl,
  mnemonicId,
  wordId,
  meaningEn,
  languageName,
  onContinue,
}: MnemonicCardProps) {
  const hasAutoPlayed = useRef(false);

  // Auto-play pronunciation when card appears
  useEffect(() => {
    if (wordId && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      playWordPronunciation(wordId).catch(() => {});
    }
  }, [wordId]);

  return (
    <Card className="animate-slide-up overflow-hidden" onClick={onContinue}>
      <p className="text-sm text-text-secondary mb-1">Remember it like this:</p>
      <div className="flex items-center gap-1 flex-wrap mb-1">
        <span className="text-lg font-bold text-accent-id">{wordText}</span>
        {wordId && (
          <span onClick={(e) => e.stopPropagation()}>
            <PronunciationButton wordId={wordId} size={18} className="-my-1" />
          </span>
        )}
        <span className="text-lg text-foreground">sounds like</span>
        <span className="text-lg font-bold text-foreground">&ldquo;{keyword}&rdquo;</span>
      </div>

      {bridgeSentence && (
        <p className="text-base text-foreground italic mb-2">
          {renderBridgeSentence(bridgeSentence)}
        </p>
      )}

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={keyword}
          className="w-full max-h-[50vh] rounded-xl mx-auto block mb-2 object-cover"
        />
      )}

      <div className="flex items-center justify-between mt-2">
        <p className="text-sm text-text-secondary">Tap to continue</p>
        {mnemonicId && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <FeedbackButtons mnemonicId={mnemonicId} context="learn" compact />
            {wordId && (
              <ShareButton
                mnemonicId={mnemonicId}
                wordId={wordId}
                wordText={wordText}
                meaningEn={meaningEn ?? ''}
                languageName={languageName ?? ''}
                compact
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
