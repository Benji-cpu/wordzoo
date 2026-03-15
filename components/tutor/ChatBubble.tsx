'use client';

import { useCallback } from 'react';
import type { PopoverData } from './WordPopover';

interface ChatBubbleProps {
  role: 'user' | 'model';
  content: string;
  vocabMap: Map<string, PopoverData>;
  onWordTap: (data: PopoverData, rect: DOMRect) => void;
}

export function ChatBubble({ role, content, vocabMap, onWordTap }: ChatBubbleProps) {
  const isUser = role === 'user';

  const handleWordClick = useCallback(
    (word: string, meaning: string, e: React.MouseEvent<HTMLSpanElement>) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const lowerWord = word.toLowerCase();

      // Check vocab map for full data
      const vocabEntry = vocabMap.get(lowerWord);
      if (vocabEntry) {
        onWordTap(vocabEntry, rect);
      } else {
        // Use inline meaning from tutor text
        onWordTap({ text: word, romanization: null, meaning_en: meaning }, rect);
      }
    },
    [vocabMap, onWordTap]
  );

  const rendered = renderContent(content, handleWordClick);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent-default text-white rounded-br-md'
            : 'bg-card-surface border border-card-border text-foreground rounded-bl-md'
        }`}
      >
        {rendered}
      </div>
    </div>
  );
}

function renderContent(
  content: string,
  onWordClick: (word: string, meaning: string, e: React.MouseEvent<HTMLSpanElement>) => void
) {
  // Parse **word** (meaning) patterns
  const pattern = /\*\*([^*]+)\*\*\s*\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const word = match[1];
    const meaning = match[2];
    parts.push(
      <span
        key={match.index}
        className="font-bold underline decoration-dotted cursor-pointer hover:opacity-80"
        onClick={(e) => onWordClick(word, meaning, e)}
      >
        {word}
      </span>,
      <span key={`m-${match.index}`} className="opacity-70"> ({meaning})</span>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}
