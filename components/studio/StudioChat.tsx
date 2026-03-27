'use client';

import { useEffect, useRef } from 'react';
import type { StudioMessage } from '@/types/database';
import { RichMessage } from './RichMessage';

interface StudioChatProps {
  messages: StudioMessage[];
  isLoading: boolean;
  onVisualSelect: (messageIndex: number, elementIndex: number, selectedIds: string[]) => void;
}

export function StudioChat({ messages, isLoading, onVisualSelect }: StudioChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((message, msgIndex) => {
        const isUser = message.role === 'user';
        return (
          <div key={msgIndex} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-[85%] ${isUser ? '' : 'w-full'}`}>
              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-accent-default text-white rounded-br-md'
                    : 'bg-card-surface border border-card-border text-foreground rounded-bl-md'
                }`}
              >
                {message.content}
              </div>

              {/* Visual elements (model messages only) */}
              {!isUser && message.visual_elements && message.visual_elements.length > 0 && (
                <RichMessage
                  elements={message.visual_elements}
                  onSelect={(elementIndex, selectedIds) =>
                    onVisualSelect(msgIndex, elementIndex, selectedIds)
                  }
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Loading / typing indicator */}
      {isLoading && (
        <div className="flex justify-start mb-3">
          <div className="bg-card-surface border border-card-border rounded-2xl rounded-bl-md px-4 py-3">
            <TypingDots />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full bg-text-secondary animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-text-secondary animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-text-secondary animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
