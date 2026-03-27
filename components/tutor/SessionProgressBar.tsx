'use client';

import { useState, useEffect, useMemo } from 'react';
import { parseMessageContent } from '@/lib/tutor/message-parser';
import type { ChatMessage } from '@/components/tutor/TutorChat';

const MODE_LABELS: Record<string, string> = {
  free_chat: 'Free Chat',
  role_play: 'Role Play',
  word_review: 'Word Review',
  grammar_glimpse: 'Grammar',
  pronunciation_coach: 'Pronunciation',
  guided_conversation: 'Guided',
  path_builder: 'Build a Path',
};

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

  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary min-w-0 overflow-hidden">
      {activeMode && (
        <span className="px-2 py-0.5 rounded-full bg-accent-default/10 text-accent-default text-xs shrink-0">
          {MODE_LABELS[activeMode] ?? activeMode}
        </span>
      )}
      {wordCount > 0 && (
        <span className="shrink-0">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
      )}
      <span className="shrink-0">{elapsed}m</span>
    </div>
  );
}
