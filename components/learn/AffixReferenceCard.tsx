'use client';

import { useState } from 'react';

const AFFIX_CATEGORIES = [
  {
    title: 'Verb-making',
    affixes: [
      { affix: 'me-', role: 'Active verb', example: 'tulis → menulis (to write)' },
      { affix: 'di-', role: 'Passive verb', example: 'tulis → ditulis (is written)' },
      { affix: 'ber-', role: 'Intransitive verb', example: 'jalan → berjalan (to walk)' },
    ],
  },
  {
    title: 'Noun-making',
    affixes: [
      { affix: 'pe-', role: 'Person/doer', example: 'tulis → penulis (writer)' },
      { affix: '-an', role: 'Result/product', example: 'tulis → tulisan (writing)' },
      { affix: 'pe-...-an', role: 'Process/place', example: 'didik → pendidikan (education)' },
    ],
  },
  {
    title: 'Adjective-making',
    affixes: [
      { affix: 'ke-...-an', role: 'State/condition', example: 'besar → kebesaran (greatness)' },
      { affix: 'se-', role: 'As...as', example: 'besar → sebesar (as big as)' },
    ],
  },
  {
    title: 'Causative',
    affixes: [
      { affix: '-kan', role: 'Make something happen', example: 'bersih → bersihkan (to clean sth)' },
      { affix: '-i', role: 'Do to/apply to', example: 'datang → datangi (to come to)' },
    ],
  },
];

export function AffixReferenceCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating reference button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full bg-accent-id/80 text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition-all hover:bg-accent-id active:scale-90"
        aria-label="Affix reference"
      >
        <span className="text-lg font-bold">?</span>
      </button>

      {/* Reference panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-card-surface border-t border-card-border animate-slide-up">
            <div className="sticky top-0 bg-card-surface/95 backdrop-blur-sm px-4 pt-4 pb-2 border-b border-card-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Indonesian Affixes</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-1">Quick reference for common affixes</p>
            </div>

            <div className="px-4 py-3 space-y-4 pb-8">
              {AFFIX_CATEGORIES.map((cat) => (
                <div key={cat.title}>
                  <h4 className="text-sm font-semibold text-accent-id mb-2">{cat.title}</h4>
                  <div className="space-y-2">
                    {cat.affixes.map((a) => (
                      <div
                        key={a.affix}
                        className="flex items-start gap-3 rounded-lg bg-white/5 px-3 py-2"
                      >
                        <span className="shrink-0 font-mono font-bold text-foreground min-w-[5rem]">
                          {a.affix}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{a.role}</p>
                          <p className="text-xs text-text-secondary">{a.example}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
