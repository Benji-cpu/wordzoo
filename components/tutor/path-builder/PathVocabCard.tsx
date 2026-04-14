'use client';

import { useState } from 'react';

interface PathVocabCardProps {
  word: string;
  romanization: string;
  meaning: string;
  mnemonicHint: string;
  onKeep: () => void;
  onRemove: () => void;
  onDifferent: () => void;
  status: 'pending' | 'kept' | 'removed';
}

export function PathVocabCard({
  word,
  romanization,
  meaning,
  mnemonicHint,
  onKeep,
  onRemove,
  onDifferent,
  status,
}: PathVocabCardProps) {
  const [showHint, setShowHint] = useState(false);

  const isKept = status === 'kept';
  const isRemoved = status === 'removed';
  const isPending = status === 'pending';

  return (
    <div
      className={`my-2 rounded-xl overflow-hidden border transition-all animate-fade-in ${
        isKept
          ? 'border-l-4 border-l-green-500 border-green-500/30 bg-green-500/5'
          : isRemoved
          ? 'border-card-border bg-card-surface/50 opacity-60'
          : 'border-card-border bg-card-surface'
      }`}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`font-bold text-base ${isRemoved ? 'line-through text-text-secondary' : 'text-foreground'}`}>
              {word}
            </span>
            {romanization && (
              <span className="text-text-secondary text-sm ml-1.5">({romanization})</span>
            )}
            <div className={`text-sm mt-0.5 ${isRemoved ? 'line-through text-text-secondary' : 'text-text-secondary'}`}>
              {meaning}
            </div>
          </div>
          {isKept && <span className="text-green-400 text-lg shrink-0">✓</span>}
          {isRemoved && <span className="text-red-400 text-lg shrink-0">✗</span>}
        </div>

        {mnemonicHint && !isRemoved && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-accent-default mt-1.5 hover:underline"
          >
            {showHint ? 'Hide mnemonic' : 'Show mnemonic'}
          </button>
        )}
        {showHint && mnemonicHint && (
          <div className="mt-1 text-xs text-text-secondary bg-surface-inset rounded-lg px-2 py-1.5 animate-fade-in">
            {mnemonicHint}
          </div>
        )}

        {isPending && (
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={onKeep}
              className="flex-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 active:scale-95 transition-all"
            >
              ✓ Keep
            </button>
            <button
              onClick={onRemove}
              className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 active:scale-95 transition-all"
            >
              ✗ Remove
            </button>
            <button
              onClick={onDifferent}
              className="flex-1 px-3 py-1.5 rounded-lg bg-surface-inset text-text-secondary text-xs font-medium hover:bg-surface-inset active:scale-95 transition-all"
            >
              ↻ Different
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
