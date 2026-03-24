'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ModeSelector } from '@/components/tutor/ModeSelector';
import { ChatBubble } from '@/components/tutor/ChatBubble';
import { ChatInput } from '@/components/tutor/ChatInput';
import { WordPopover } from '@/components/tutor/WordPopover';
import type { PopoverData } from '@/components/tutor/WordPopover';
import { SessionSummary } from '@/components/tutor/SessionSummary';
import { useTutorChat } from '@/lib/hooks/useTutorChat';
import { useSpeechInput } from '@/lib/hooks/useSpeechInput';

type ViewState = 'mode_select' | 'chatting' | 'summary';

interface SessionSummaryData {
  messageCount: number;
  userMessageCount: number;
  wordCount: number;
  wordsUsed: string[];
  durationMinutes: number;
  mode: string;
}

export default function TutorPage() {
  const [view, setView] = useState<ViewState>('mode_select');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [langCode, setLangCode] = useState('en');
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [summaryData, setSummaryData] = useState<SessionSummaryData | null>(null);
  const [popover, setPopover] = useState<{ data: PopoverData; rect: DOMRect } | null>(null);
  const vocabMapRef = useRef(new Map<string, PopoverData>());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, error, sendMessage, addGreeting } = useTutorChat(sessionId);
  const { isListening, transcript, startListening, stopListening } = useSpeechInput(langCode);

  // Fetch user's active path to get language
  useEffect(() => {
    async function fetchLanguage() {
      try {
        const res = await fetch('/api/paths/active');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.languageId) {
            setLanguageId(json.data.languageId);
            if (json.data.languageCode) {
              setLangCode(mapLanguageCode(json.data.languageCode));
            }
          }
        }
      } catch {
        // Fallback: languageId will be null, user can still try
      } finally {
        setIsLoadingLanguage(false);
      }
    }
    fetchLanguage();
  }, []);

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
          vocabMapRef.current = map;
        }
      } catch {
        // Non-critical, popover will fall back to inline meanings
      }
    }
    fetchVocab();
  }, [languageId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartSession = useCallback(
    async (mode: string, scenario?: string) => {
      if (!languageId) return;
      setIsStarting(true);
      try {
        const res = await fetch('/api/tutor/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, languageId, scenario }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error ?? 'Failed to start session');
        }
        setSessionId(json.data.sessionId);
        addGreeting(json.data.greeting);
        setView('chatting');
      } catch (err) {
        console.error('Start session error:', err);
      } finally {
        setIsStarting(false);
      }
    },
    [languageId, addGreeting]
  );

  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    setIsEnding(true);
    try {
      const res = await fetch('/api/tutor/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setSummaryData(json.data as SessionSummaryData);
        setView('summary');
      }
    } catch (err) {
      console.error('End session error:', err);
    } finally {
      setIsEnding(false);
    }
  }, [sessionId]);

  const handleNewSession = useCallback(() => {
    setSessionId(null);
    setSummaryData(null);
    setPopover(null);
    setView('mode_select');
  }, []);

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

  if (isLoadingLanguage) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">AI Tutor</h1>
        <p className="mt-2 text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!languageId) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">AI Tutor</h1>
        <p className="mt-2 text-text-secondary">
          Start a learning path first to use the tutor.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100dvh-8rem)]">
      {view === 'mode_select' && (
        <div className="px-4 pt-4">
          <h1 className="text-2xl font-bold text-foreground mb-4">AI Tutor</h1>
          <ModeSelector onSelect={handleStartSession} disabled={isStarting} />
        </div>
      )}

      {view === 'chatting' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
            <h2 className="font-semibold text-foreground">AI Tutor</h2>
            <button
              onClick={handleEndSession}
              disabled={isEnding || isStreaming}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              {isEnding ? 'Ending...' : 'End Session'}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                vocabMap={vocabMapRef.current}
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
            onSend={sendMessage}
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
        <div className="px-4 pt-8">
          <SessionSummary summary={summaryData} onNewSession={handleNewSession} />
        </div>
      )}
    </div>
  );
}

function mapLanguageCode(code: string): string {
  const map: Record<string, string> = {
    id: 'id-ID',
    es: 'es-ES',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-BR',
    it: 'it-IT',
    th: 'th-TH',
    vi: 'vi-VN',
    ar: 'ar-SA',
    hi: 'hi-IN',
    ru: 'ru-RU',
  };
  return map[code] ?? `${code}-${code.toUpperCase()}`;
}
