'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isListening?: boolean;
  transcript?: string;
  audioLevel?: number;
  onMicToggle?: () => void;
}

// 5 bars with staggered base heights for an organic look
const BAR_BASE = [0.3, 0.6, 1.0, 0.6, 0.3];

function WaveformBars({ audioLevel }: { audioLevel: number }) {
  return (
    <span className="flex items-center gap-0.5 h-5">
      {BAR_BASE.map((base, i) => {
        const height = Math.max(0.15, audioLevel * base);
        return (
          <span
            key={i}
            className="inline-block w-[3px] rounded-full bg-white"
            style={{
              height: `${Math.round(height * 20)}px`,
              minHeight: '3px',
              maxHeight: '20px',
              transition: 'height 80ms ease-out',
            }}
          />
        );
      })}
    </span>
  );
}

export function ChatInput({ onSend, disabled, isListening, transcript, audioLevel = 0, onMicToggle }: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync speech transcript into input
  useEffect(() => {
    if (transcript) {
      setText(transcript);
    }
  }, [transcript]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-background border-t border-card-border">
      {onMicToggle && (
        <button
          type="button"
          onClick={onMicToggle}
          title={isListening ? 'Stop recording' : 'Start recording'}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-500 text-white'
              : 'bg-card-surface border border-card-border text-text-secondary'
          }`}
        >
          {isListening ? (
            <WaveformBars audioLevel={audioLevel} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isListening ? 'Listening...' : 'Type a message...'}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 rounded-xl bg-card-surface border border-card-border text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-default disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-default text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
}
