'use client';

import { useState } from 'react';
import { VoteButton } from './VoteButton';
import { FlagButton } from './FlagButton';
import { MnemonicImage } from '@/components/shared/MnemonicImage';
import type { CommunityMnemonicCard as CardData } from '@/types/community';

interface CommunityMnemonicCardProps {
  card: CardData;
  isOwnMnemonic: boolean;
}

export function CommunityMnemonicCard({ card, isOwnMnemonic }: CommunityMnemonicCardProps) {
  const [adopted, setAdopted] = useState(false);
  const [adoptLoading, setAdoptLoading] = useState(false);

  async function handleAdopt() {
    setAdoptLoading(true);
    try {
      const res = await fetch('/api/community/adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonicId: card.mnemonic_id, wordId: card.word_id }),
      });
      const json = await res.json();
      if (!json.error) {
        setAdopted(true);
      }
    } catch {
      // Silently fail
    } finally {
      setAdoptLoading(false);
    }
  }

  return (
    <div className="glass-card p-4 animate-fade-in">
      {/* Author */}
      <div className="flex items-center gap-2 mb-3">
        {card.author_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.author_image}
            alt=""
            className="w-6 h-6 rounded-full border border-card-border"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-card-surface border border-card-border flex items-center justify-center text-[10px] text-text-secondary">
            {card.author_name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <span className="text-xs text-text-secondary">{card.author_name ?? 'Anonymous'}</span>
      </div>

      {/* Keyword */}
      {card.keyword_text && (
        <p className="text-sm font-medium text-foreground mb-2">
          Sounds like &ldquo;{card.keyword_text}&rdquo;
        </p>
      )}

      {/* Image */}
      {card.image_url && (
        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-surface-inset">
          <MnemonicImage
            src={card.image_url}
            alt={card.scene_description}
            variant="community"
            fallback={null}
          />
        </div>
      )}

      {/* Scene description */}
      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
        {card.scene_description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <VoteButton
          mnemonicId={card.mnemonic_id}
          initialCount={card.upvote_count}
          initialVoted={card.has_voted}
          disabled={isOwnMnemonic}
        />

        {!isOwnMnemonic && (
          <button
            onClick={handleAdopt}
            disabled={adopted || adoptLoading}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              adopted
                ? 'bg-green-500/20 text-green-400'
                : 'bg-surface-inset text-text-secondary hover:bg-surface-inset'
            }`}
          >
            {adopted ? 'Using!' : adoptLoading ? '...' : 'Use This'}
          </button>
        )}

        <div className="ml-auto">
          <FlagButton mnemonicId={card.mnemonic_id} />
        </div>
      </div>
    </div>
  );
}
