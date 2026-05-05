'use client';

import { useState, useCallback, useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export function useTutorChat(sessionId: string | null, onAutoEnd?: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  // null = unknown/unlimited; number = remaining tutor messages today
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoEndRef = useRef(false);

  // Allow callers (e.g. the page) to seed the remaining count from billing/status.
  const setRemaining = useCallback((next: number | null) => {
    setMessagesRemaining(next);
    if (next !== null && next <= 0) setLimitReached(true);
  }, []);

  const addGreeting = useCallback((greeting: string) => {
    setMessages([{ role: 'model', content: greeting }]);
  }, []);

  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
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
          if (response.status === 403) {
            // Limit reached — remove the optimistic user message + empty model placeholder
            setMessages((prev) => prev.slice(0, -2));
            setLimitReached(true);
            setMessagesRemaining(0);
            setIsStreaming(false);
            abortRef.current = null;
            return;
          }
          throw new Error(errorData?.error ?? `Request failed (${response.status})`);
        }

        autoEndRef.current = response.headers.get('X-Session-Auto-End') === 'true';

        const remainingHeader = response.headers.get('X-Tutor-Messages-Remaining');
        if (remainingHeader === 'unlimited') {
          setMessagesRemaining(null);
        } else if (remainingHeader !== null) {
          const n = Number(remainingHeader);
          if (!Number.isNaN(n)) {
            setMessagesRemaining(n);
            if (n <= 0) setLimitReached(true);
          }
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
        if (autoEndRef.current && onAutoEnd) {
          autoEndRef.current = false;
          onAutoEnd();
        }
      }
    },
    [sessionId, isStreaming, onAutoEnd]
  );

  return { messages, isStreaming, error, limitReached, messagesRemaining, sendMessage, addGreeting, loadMessages, setRemaining };
}
