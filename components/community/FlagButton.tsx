'use client';

import { useState } from 'react';

const FLAG_REASONS = [
  { value: 'offensive', label: 'Offensive' },
  { value: 'spam', label: 'Spam' },
  { value: 'misleading', label: 'Misleading' },
  { value: 'other', label: 'Other' },
] as const;

interface FlagButtonProps {
  mnemonicId: string;
}

export function FlagButton({ mnemonicId }: FlagButtonProps) {
  const [open, setOpen] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleFlag(reason: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/community/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonicId, reason }),
      });
      const json = await res.json();
      if (!json.error) {
        setFlagged(true);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  if (flagged) {
    return (
      <span className="text-xs text-text-secondary px-2 py-1">Reported</span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-inset transition-colors"
        title="Report"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-1 glass-card p-2 min-w-[140px] z-50">
          {FLAG_REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => handleFlag(r.value)}
              disabled={loading}
              className="block w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:text-foreground hover:bg-surface-inset rounded transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
