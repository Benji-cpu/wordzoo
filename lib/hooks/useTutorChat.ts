'use client';

import { useState, useCallback, useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export function useTutorChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addGreeting = useCallback((greeting: string) => {
    setMessages([{ role: 'model', content: greeting }]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || isStreaming) return;

      setError(null);
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      setIsStreaming(true);

      // Add placeholder for model response
      setMessages((prev) => [...prev, { role: 'model', content: '' }]);

      try {
        abortRef.current = new AbortController();
        const response = await fetch('/api/tutor/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error ?? `Request failed (${response.status})`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          const current = accumulated;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', content: current };
            return updated;
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        // Remove the empty model message on error
        setMessages((prev) => {
          if (prev[prev.length - 1]?.content === '') {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [sessionId, isStreaming]
  );

  return { messages, isStreaming, error, sendMessage, addGreeting };
}
