'use client';

import { useState, useRef } from 'react';

interface StudioInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function StudioInput({ onSend, disabled }: StudioInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-background border-t border-card-border"
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 px-4 py-2.5 rounded-xl bg-card-surface border border-card-border text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-default disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-default text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
        aria-label="Send message"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
}
