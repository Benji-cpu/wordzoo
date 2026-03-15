'use client';

import { useState } from 'react';
import { CommunityMnemonicCard } from '@/components/community/CommunityMnemonicCard';
import { SubmitMnemonicModal } from '@/components/community/SubmitMnemonicModal';
import type { CommunityMnemonicCard as CardData } from '@/types/community';
import type { UserMnemonicData } from '@/lib/db/community-queries';

interface CommunityClientProps {
  wordId: string;
  initialItems: CardData[];
  initialTotal: number;
  userId: string;
  userMnemonic: UserMnemonicData | null;
}

export function CommunityClient({ wordId, initialItems, initialTotal, userId, userMnemonic }: CommunityClientProps) {
  const [items, setItems] = useState<CardData[]>(initialItems);
  const [total] = useState(initialTotal);
  const [sort, setSort] = useState<'top' | 'new'>('top');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length < initialTotal);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(userMnemonic?.already_submitted ?? false);

  async function fetchItems(newSort: 'top' | 'new', newPage: number, append: boolean) {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/${wordId}?sort=${newSort}&page=${newPage}`);
      const json = await res.json();
      if (json.data) {
        setItems(prev => append ? [...prev, ...json.data.items] : json.data.items);
        setHasMore(json.data.hasMore);
        setPage(newPage);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  function handleSortChange(newSort: 'top' | 'new') {
    if (newSort === sort) return;
    setSort(newSort);
    fetchItems(newSort, 1, false);
  }

  function handleLoadMore() {
    fetchItems(sort, page + 1, true);
  }

  return (
    <div>
      {/* Sort toggle */}
      <div className="flex gap-2 mb-4">
        {(['top', 'new'] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleSortChange(s)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              sort === s
                ? 'bg-accent-default text-white'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            {s === 'top' ? 'Top' : 'Newest'}
          </button>
        ))}
      </div>

      {/* Card list */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No community mnemonics yet.</p>
          <p className="text-xs text-text-secondary mt-1">Be the first to share yours!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((card) => (
            <CommunityMnemonicCard
              key={card.id}
              card={card}
              isOwnMnemonic={card.author_id === userId}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 rounded-xl text-sm bg-white/5 text-text-secondary hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Total count */}
      {total > 0 && (
        <p className="text-center text-xs text-text-secondary mt-4">
          Showing {items.length} of {total}
        </p>
      )}

      {/* Submit FAB */}
      {userMnemonic && !hasSubmitted && (
        <button
          onClick={() => setShowSubmitModal(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-accent-default text-white font-medium shadow-lg hover:bg-accent-default/80 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Submit Yours
        </button>
      )}

      {/* Submit modal */}
      {showSubmitModal && userMnemonic && (
        <SubmitMnemonicModal
          mnemonicId={userMnemonic.mnemonic_id}
          keyword={userMnemonic.keyword_text}
          sceneDescription={userMnemonic.scene_description}
          imageUrl={userMnemonic.image_url}
          wordId={wordId}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={() => {
            setShowSubmitModal(false);
            setHasSubmitted(true);
            fetchItems(sort, 1, false);
          }}
        />
      )}
    </div>
  );
}
