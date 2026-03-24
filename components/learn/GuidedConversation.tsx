'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface GuidedConversationProps {
  sceneId: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export function GuidedConversation({ sceneId, onComplete, onSkip }: GuidedConversationProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start guided session on mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch('/api/tutor/guided-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sceneId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? 'Failed to start conversation');
        }
        const json = await res.json();
        if (cancelled) return;
        setSessionId(json.data.sessionId);
        setMessages([{ role: 'model', content: json.data.greeting }]);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to start conversation');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [sceneId]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!sessionId || isStreaming || !text.trim()) return;

    setError(null);
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setMessages(prev => [...prev, { role: 'model', content: '' }]);
    setIsStreaming(true);

    try {
      const res = await fetch('/api/tutor/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to send message');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const current = accumulated;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: current };
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages(prev => {
        if (prev[prev.length - 1]?.content === '') return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [sessionId, isStreaming]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  if (isLoading) {
    return (
      <div className="text-center py-12 animate-slide-up">
        <div className="inline-block w-8 h-8 border-2 border-accent-default border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-text-secondary">Setting up your practice conversation...</p>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="text-center py-12 animate-slide-up">
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <button
          className="px-6 py-3 rounded-xl bg-card-surface border border-card-border text-foreground font-medium"
          onClick={onSkip}
        >
          Skip to Summary
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-1 space-y-3 pb-4">
        <p className="text-center text-text-secondary text-xs mb-2">
          Practice what you learned! This is optional.
        </p>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent-default text-white rounded-br-md'
                  : 'bg-card-surface border border-card-border text-foreground rounded-bl-md'
              }`}
            >
              {msg.content || (
                <span className="inline-block w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <p className="text-center text-xs text-red-400 py-1">{error}</p>
      )}

      {/* Input + actions */}
      <div className="border-t border-card-border pt-3 space-y-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type in Indonesian..."
            disabled={isStreaming}
            className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-card-surface border border-card-border text-foreground text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-default"
          />
          <button
            type="submit"
            disabled={isStreaming || !inputText.trim()}
            className="min-h-[44px] px-4 rounded-xl bg-accent-default text-white font-medium text-sm disabled:opacity-50"
          >
            Send
          </button>
        </form>

        <div className="flex gap-2">
          <button
            className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-card-surface border border-card-border text-foreground text-sm font-medium"
            onClick={onSkip}
          >
            Skip
          </button>
          <button
            className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium"
            onClick={onComplete}
            disabled={messages.length < 3}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
