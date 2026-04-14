'use client';

import { useState } from 'react';

interface VoteButtonProps {
  mnemonicId: string;
  initialCount: number;
  initialVoted: boolean;
  disabled?: boolean;
}

export function VoteButton({ mnemonicId, initialCount, initialVoted, disabled }: VoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleVote() {
    if (loading || disabled) return;

    // Optimistic update
    const prevVoted = voted;
    const prevCount = count;
    setVoted(!voted);
    setCount(voted ? count - 1 : count + 1);
    setLoading(true);

    try {
      const res = await fetch('/api/community/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonicId }),
      });
      const json = await res.json();
      if (json.error) {
        // Roll back
        setVoted(prevVoted);
        setCount(prevCount);
      } else {
        setVoted(json.data.voted);
        setCount(json.data.newCount);
      }
    } catch {
      // Roll back
      setVoted(prevVoted);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        voted
          ? 'bg-accent-default/20 text-accent-default'
          : 'bg-surface-inset text-text-secondary hover:bg-surface-inset'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={voted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 4l-8 8h5v8h6v-8h5z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}
