'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import type { GalleryWord } from '@/lib/db/queries';

export function MnemonicGalleryCard({ word }: { word: GalleryWord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Mnemonic Image */}
      {word.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={word.image_url}
          alt={word.scene_description}
          className="w-full h-32 object-cover -mx-4 -mt-4 mb-3"
          style={{ width: 'calc(100% + 2rem)' }}
        />
      ) : (
        <div className="w-full h-24 bg-card-surface -mx-4 -mt-4 mb-3 flex items-center justify-center" style={{ width: 'calc(100% + 2rem)' }}>
          <span className="text-3xl">🧠</span>
        </div>
      )}

      {/* Word + Keyword */}
      <div className="text-center">
        <p className="text-lg font-bold text-accent-id">{word.text}</p>
        <p className="text-sm text-text-secondary">{word.meaning_en}</p>
        {word.keyword_text && (
          <p className="text-xs text-text-secondary mt-1 italic">
            &ldquo;{word.keyword_text}&rdquo;
          </p>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-card-border space-y-2 animate-slide-up">
          <p className="text-sm text-foreground">{word.scene_description}</p>
          {word.bridge_sentence && (
            <p className="text-xs text-text-secondary italic">{word.bridge_sentence}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">{word.path_title}</span>
            <div onClick={(e) => e.stopPropagation()}>
              <PronunciationButton
                wordId={word.word_id}
                audioUrl={word.pronunciation_audio_url}
                text={word.text}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
