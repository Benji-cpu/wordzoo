'use client';

import { useState, useEffect, useMemo } from 'react';
import { parseMessageContent } from '@/lib/tutor/message-parser';
import { MODE_LABELS, turnCapForMode } from '@/lib/tutor/modes';
import type { ChatMessage } from '@/components/tutor/TutorChat';

interface SessionProgressBarProps {
  activeMode: string | null;
  messages: ChatMessage[];
}

export function SessionProgressBar({ activeMode, messages }: SessionProgressBarProps) {
  const [elapsed, setElapsed] = useState(0);

  // Timer: count minutes since component mount (session start)
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Count unique vocab words from model messages
  const wordCount = useMemo(() => {
    const seen = new Set<string>();
    for (const msg of messages) {
      if (msg.role !== 'model') continue;
      const segments = parseMessageContent(msg.content);
      for (const seg of segments) {
        if (seg.type === 'vocab_word') {
          seen.add(seg.word.toLowerCase());
        }
      }
    }
    return seen.size;
  }, [messages]);

  // Turns taken so far. The session ends at the cap, and until now nothing in
  // the UI said so — the learner sent their last message and the screen simply
  // swapped to a summary. Showing the count makes the ending earned.
  const turn = useMemo(() => messages.filter((m) => m.role === 'user').length, [messages]);
  const cap = turnCapForMode(activeMode);
  const onLastTurn = cap !== null && turn >= cap;

  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary min-w-0 overflow-hidden">
      {activeMode && (
        <span className="px-2 py-0.5 rounded-full bg-accent-default/10 text-accent-default text-xs shrink-0">
          {MODE_LABELS[activeMode] ?? activeMode}
        </span>
      )}
      {cap !== null && (
        <span
          className={`flex items-center gap-1.5 shrink-0 ${onLastTurn ? 'text-accent-default font-medium' : ''}`}
          title={onLastTurn ? 'Last exchange of this session' : `Exchange ${turn} of ${cap}`}
        >
          <span className="tabular-nums">{Math.min(turn, cap)}/{cap}</span>
          <span className="flex gap-0.5" aria-hidden>
            {Array.from({ length: cap }, (_, i) => (
              <span
                key={i}
                className={`w-1 h-2.5 rounded-full transition-colors ${
                  i < turn ? 'bg-accent-default' : 'bg-card-border'
                }`}
              />
            ))}
          </span>
        </span>
      )}
      {wordCount > 0 && (
        <span className="shrink-0">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
      )}
      <span className="shrink-0">{elapsed}m</span>
    </div>
  );
}
