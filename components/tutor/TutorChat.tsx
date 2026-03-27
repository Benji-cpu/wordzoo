'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ModeSelector } from '@/components/tutor/ModeSelector';
import { ChatBubble } from '@/components/tutor/ChatBubble';
import { ChatInput } from '@/components/tutor/ChatInput';
import { WordPopover } from '@/components/tutor/WordPopover';
import type { PopoverData } from '@/components/tutor/WordPopover';
import { SessionSummary } from '@/components/tutor/SessionSummary';
import { SuggestionChips } from '@/components/tutor/SuggestionChips';
import { SessionProgressBar } from '@/components/tutor/SessionProgressBar';
import { parseMessageContent, extractSuggestions } from '@/lib/tutor/message-parser';
import { useSpeechInput } from '@/lib/hooks/useSpeechInput';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface SessionSummaryData {
  messageCount: number;
  userMessageCount: number;
  wordCount: number;
  wordsUsed: string[];
  durationMinutes: number;
  mode: string;
  srsReviewsRecorded?: number;
  wordsIntroduced?: number;
  accuracyRate?: number;
}

interface TutorChatProps {
  languageId: string;
  langCode: string;
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
  onStartSession: (mode: string, scenario?: string) => void;
  onEndSession: () => void;
  onNewSession: () => void;
  sessionId: string | null;
  isStarting: boolean;
  isEnding: boolean;
  summaryData: SessionSummaryData | null;
  compact?: boolean;
  className?: string;
  initialMode?: string;
  activeMode?: string | null;
}

function mapLanguageCode(code: string): string {
  const map: Record<string, string> = {
    id: 'id-ID', es: 'es-ES', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN',
    fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR', it: 'it-IT', th: 'th-TH',
    vi: 'vi-VN', ar: 'ar-SA', hi: 'hi-IN', ru: 'ru-RU',
  };
  return map[code] ?? `${code}-${code.toUpperCase()}`;
}

type ViewState = 'mode_select' | 'chatting' | 'summary';

export function TutorChat({
  languageId,
  langCode,
  messages,
  isStreaming,
  error,
  onSendMessage,
  onStartSession,
  onEndSession,
  onNewSession,
  sessionId,
  isStarting,
  isEnding,
  summaryData,
  compact,
  className,
  initialMode,
  activeMode,
}: TutorChatProps) {
  const [popover, setPopover] = useState<{ data: PopoverData; rect: DOMRect } | null>(null);
  const [vocabMap, setVocabMap] = useState(() => new Map<string, PopoverData>());
  const [vocabStatuses, setVocabStatuses] = useState(() => new Map<string, 'pending' | 'kept' | 'removed'>());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechLangCode = mapLanguageCode(langCode);
  const { isListening, transcript, startListening, stopListening } = useSpeechInput(speechLangCode);

  // Derive view state from props
  const view: ViewState = summaryData ? 'summary' : sessionId ? 'chatting' : 'mode_select';

  // Pre-fetch vocabulary for popover
  useEffect(() => {
    if (!languageId) return;
    async function fetchVocab() {
      try {
        const res = await fetch(`/api/tutor/vocabulary?languageId=${languageId}`);
        if (res.ok) {
          const json = await res.json();
          const map = new Map<string, PopoverData>();
          for (const item of json.data ?? []) {
            map.set(item.text.toLowerCase(), {
              text: item.text,
              romanization: item.romanization,
              meaning_en: item.meaning_en,
              pronunciation_audio_url: item.pronunciation_audio_url,
              keyword_text: item.keyword_text,
              scene_description: item.scene_description,
            });
          }
          setVocabMap(map);
        }
      } catch {
        // Non-critical
      }
    }
    fetchVocab();
  }, [languageId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-start session if initialMode provided
  useEffect(() => {
    if (initialMode && view === 'mode_select' && !isStarting) {
      onStartSession(initialMode);
    }
  }, [initialMode, view, isStarting, onStartSession]);

  // Reset vocab statuses when session ends
  useEffect(() => {
    if (!sessionId) {
      setVocabStatuses(new Map());
    }
  }, [sessionId]);

  const handleWordTap = useCallback((data: PopoverData, rect: DOMRect) => {
    setPopover({ data, rect });
  }, []);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handlePathVocabAction = useCallback(
    async (word: string, action: 'keep' | 'remove' | 'different') => {
      if (!sessionId) return;

      setVocabStatuses((prev) => {
        const next = new Map(prev);
        next.set(word, action === 'keep' ? 'kept' : 'removed');
        return next;
      });

      try {
        const res = await fetch('/api/tutor/path-builder/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            action,
            itemType: 'vocabulary',
            tempId: word,
          }),
        });

        if (!res.ok) {
          setVocabStatuses((prev) => {
            const next = new Map(prev);
            next.set(word, 'pending');
            return next;
          });
        }

        if (action === 'different') {
          onSendMessage(`Can you suggest a different word instead of "${word}"?`);
        }
      } catch {
        setVocabStatuses((prev) => {
          const next = new Map(prev);
          next.set(word, 'pending');
          return next;
        });
      }
    },
    [sessionId, onSendMessage]
  );

  // Extract suggestion chips from last model message (only when not streaming)
  const suggestionOptions = useMemo(() => {
    if (isStreaming) return [];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'model') {
        const segments = parseMessageContent(messages[i].content);
        return extractSuggestions(segments);
      }
    }
    return [];
  }, [messages, isStreaming]);

  function extractStudioCTA(content: string): { description: string } | null {
    const match = content.match(/\[PATH_STUDIO_CTA:\s*(.+?)\]/);
    if (!match) return null;
    return { description: match[1] };
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[calc(100dvh-8rem)]'} ${className ?? ''}`}>
      {view === 'mode_select' && (
        <div className={compact ? 'px-3 pt-3' : 'px-4 pt-4'}>
          {!compact && <h1 className="text-2xl font-bold text-foreground mb-4">AI Tutor</h1>}
          <ModeSelector onSelect={onStartSession} disabled={isStarting} />
        </div>
      )}

      {view === 'chatting' && (
        <>
          {/* Header */}
          <div className={`flex items-center justify-between ${compact ? 'px-3 py-2' : 'px-4 py-3'} border-b border-card-border`}>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className={`font-semibold text-foreground ${compact ? 'text-sm' : ''} shrink-0`}>AI Tutor</h2>
              <SessionProgressBar activeMode={activeMode ?? null} messages={messages} />
            </div>
            <button
              onClick={onEndSession}
              disabled={isEnding || isStreaming}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 shrink-0"
            >
              {isEnding ? 'Ending...' : 'End Session'}
            </button>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
            {messages.map((msg, i) => (
              <div key={i}>
                <ChatBubble
                  role={msg.role}
                  content={msg.content}
                  vocabMap={vocabMap}
                  onWordTap={handleWordTap}
                  onPathVocabAction={activeMode === 'path_builder' ? handlePathVocabAction : undefined}
                  vocabStatuses={activeMode === 'path_builder' ? vocabStatuses : undefined}
                />
                {msg.role === 'model' && extractStudioCTA(msg.content) && (
                  <Link
                    href={`/paths/studio?prefillScenario=${encodeURIComponent(extractStudioCTA(msg.content)!.description)}&languageId=${languageId}`}
                    className="block mx-2 mb-3 p-3 rounded-xl bg-accent-default/10 border border-accent-default/30 hover:bg-accent-default/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-default shrink-0">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-accent-default">Open in Path Studio</p>
                        <p className="text-xs text-text-secondary">Create a custom path with dialogues</p>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            ))}
            {error && (
              <div className="text-center text-sm text-red-400 py-2">{error}</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          {suggestionOptions.length > 0 && (
            <SuggestionChips options={suggestionOptions} onSelect={onSendMessage} />
          )}

          {/* Input */}
          <ChatInput
            onSend={onSendMessage}
            disabled={isStreaming}
            isListening={isListening}
            transcript={transcript}
            onMicToggle={handleMicToggle}
          />

          {/* Word popover */}
          {popover && (
            <WordPopover
              data={popover.data}
              anchorRect={popover.rect}
              onClose={() => setPopover(null)}
            />
          )}
        </>
      )}

      {view === 'summary' && summaryData && (
        <div className={compact ? 'px-3 pt-4' : 'px-4 pt-8'}>
          <SessionSummary
            summary={summaryData}
            onNewSession={onNewSession}
            onStartSession={onStartSession}
            mode={activeMode ?? undefined}
            messages={messages}
          />
        </div>
      )}
    </div>
  );
}
