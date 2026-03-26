'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ModeSelector } from '@/components/tutor/ModeSelector';
import { ChatBubble } from '@/components/tutor/ChatBubble';
import { ChatInput } from '@/components/tutor/ChatInput';
import { WordPopover } from '@/components/tutor/WordPopover';
import type { PopoverData } from '@/components/tutor/WordPopover';
import { SessionSummary } from '@/components/tutor/SessionSummary';
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
}: TutorChatProps) {
  const [popover, setPopover] = useState<{ data: PopoverData; rect: DOMRect } | null>(null);
  const [vocabMap, setVocabMap] = useState(() => new Map<string, PopoverData>());
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
            <h2 className={`font-semibold text-foreground ${compact ? 'text-sm' : ''}`}>AI Tutor</h2>
            <button
              onClick={onEndSession}
              disabled={isEnding || isStreaming}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              {isEnding ? 'Ending...' : 'End Session'}
            </button>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                vocabMap={vocabMap}
                onWordTap={handleWordTap}
              />
            ))}
            {error && (
              <div className="text-center text-sm text-red-400 py-2">{error}</div>
            )}
            <div ref={messagesEndRef} />
          </div>

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
          <SessionSummary summary={summaryData} onNewSession={onNewSession} />
        </div>
      )}
    </div>
  );
}
