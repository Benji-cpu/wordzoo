'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

export interface WordFamilyDerivedForm {
  affix_type: string;
  derived_word: string;
  derived_meaning: string;
  meaning_shift: string;
}

export interface WordFamilyCardProps {
  rootWord: { text: string; meaning: string };
  derivedForms: WordFamilyDerivedForm[];
}

export function WordFamilyCard({ rootWord, derivedForms }: WordFamilyCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (derivedForms.length === 0) return null;

  return (
    <Card className="py-4 px-4">
      {/* Root word header */}
      <div className="text-center mb-3">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
          Word Family
        </p>
        <p className="text-lg font-bold text-accent-id">
          {rootWord.text}
        </p>
        <p className="text-sm text-text-secondary">
          {rootWord.meaning}
        </p>
      </div>

      {/* Derived forms grid */}
      <div className="grid grid-cols-1 gap-2">
        {derivedForms.map((form, i) => (
          <button
            key={`${form.affix_type}-${form.derived_word}`}
            className={`text-left rounded-lg border transition-all duration-200 px-3 py-2 ${
              expandedIndex === i
                ? 'border-accent-id/40 bg-accent-id/5'
                : 'border-card-border bg-card-surface hover:border-accent-id/20'
            }`}
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-accent-id/10 text-accent-id shrink-0">
                {form.affix_type}
              </span>
              <span className="font-medium text-foreground">
                {form.derived_word}
              </span>
              <span className="text-text-secondary text-sm ml-auto">
                {form.derived_meaning}
              </span>
            </div>

            {/* Expanded meaning shift explanation */}
            {expandedIndex === i && form.meaning_shift && (
              <p className="text-xs text-text-secondary mt-2 pt-2 border-t border-card-border animate-fade-in">
                {form.meaning_shift}
              </p>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Collapsible wrapper for inline use in scene flow */
export function CollapsibleWordFamily({ rootWord, derivedForms }: WordFamilyCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (derivedForms.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm text-accent-id hover:text-accent-id/80 transition-colors mx-auto"
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {expanded ? 'Hide' : 'See'} word family ({derivedForms.length})
      </button>

      {expanded && (
        <div className="mt-2 animate-slide-up">
          <WordFamilyCard rootWord={rootWord} derivedForms={derivedForms} />
        </div>
      )}
    </div>
  );
}
