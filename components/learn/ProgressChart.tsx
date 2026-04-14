'use client';

import { useState } from 'react';
import type { MasteryDistribution, WordByStatus } from '@/lib/db/queries';

const TIERS = [
  { key: 'learning_count' as const, label: 'Learning', status: 'learning' as const, color: 'bg-blue-400', dot: 'bg-blue-400' },
  { key: 'reviewing_count' as const, label: 'Reviewing', status: 'reviewing' as const, color: 'bg-amber-400', dot: 'bg-amber-400' },
  { key: 'mastered_count' as const, label: 'Mastered', status: 'mastered' as const, color: 'bg-green-500', dot: 'bg-green-500' },
];

type FilterTab = 'all' | 'learning' | 'reviewing' | 'mastered';

export function ProgressChart({
  distribution,
  streak,
  wordsByStatus = [],
}: {
  distribution: MasteryDistribution;
  streak: number;
  wordsByStatus?: WordByStatus[];
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const active = distribution.total_count - distribution.new_count;
  const hasWords = wordsByStatus.length > 0;

  const filteredWords = activeFilter === 'all'
    ? wordsByStatus
    : wordsByStatus.filter(w => w.status === activeFilter);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: wordsByStatus.length },
    ...TIERS
      .map(t => ({ key: t.status as FilterTab, label: t.label, count: wordsByStatus.filter(w => w.status === t.status).length }))
      .filter(t => t.count > 0),
  ];

  return (
    <>
      <div
        className={`p-4 rounded-xl bg-card-surface border border-card-border space-y-3 ${hasWords ? 'cursor-pointer' : ''}`}
        onClick={hasWords ? () => { setActiveFilter('all'); setSheetOpen(true); } : undefined}
        onKeyDown={hasWords ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveFilter('all'); setSheetOpen(true); } } : undefined}
        role={hasWords ? 'button' : undefined}
        tabIndex={hasWords ? 0 : undefined}
      >
        {/* Header with chevron */}
        {hasWords && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Mastery</span>
            <svg
              className="w-4 h-4 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        )}

        {/* Mastery Bar */}
        {active > 0 ? (
          <div>
            <div className="flex h-3 rounded-full overflow-hidden bg-background">
              {TIERS.map(tier => {
                const pct = (distribution[tier.key] / active) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={tier.key}
                    className={`${tier.color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap justify-between gap-y-1 mt-2">
              {TIERS.map(tier => (
                <div key={tier.key} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${tier.color}`} />
                  <span className="text-xs text-text-secondary">
                    {tier.label}: {distribution[tier.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary text-center">Start learning to see your progress!</p>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{active}</p>
            <p className="text-xs text-text-secondary">Words Active</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{distribution.mastered_count}</p>
            <p className="text-xs text-text-secondary">Mastered</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{streak}d</p>
            <p className="text-xs text-text-secondary">Streak</p>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] flex flex-col rounded-t-2xl bg-card-surface border-t border-card-border animate-slide-up">
            {/* Sticky header */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-card-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">
                  Your Vocabulary ({filteredWords.length})
                </h3>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="p-1 rounded-full hover:bg-surface-inset transition-colors"
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={(e) => { e.stopPropagation(); setActiveFilter(tab.key); }}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeFilter === tab.key
                        ? 'bg-accent-default text-white'
                        : 'bg-surface-inset text-text-secondary'
                    }`}
                  >
                    {tab.label} {tab.count}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable word list */}
            <div className="overflow-y-auto px-4 py-3 space-y-2 pb-8">
              {filteredWords.map(w => {
                const tier = TIERS.find(t => t.status === w.status);
                return (
                  <div
                    key={w.word_id}
                    className="flex items-center gap-3 rounded-lg bg-surface-inset px-3 py-2"
                  >
                    {activeFilter === 'all' && (
                      <div className={`w-2 h-2 shrink-0 rounded-full ${tier?.dot ?? 'bg-gray-400'}`} />
                    )}
                    <span className="font-medium text-sm text-foreground">{w.text}</span>
                    <span className="text-sm text-text-secondary truncate">{w.meaning_en}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
