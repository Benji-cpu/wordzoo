'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { TutorHero } from '@/components/tutor/TutorHero';
import { ChatBubble } from '@/components/tutor/ChatBubble';
import { ChatInput } from '@/components/tutor/ChatInput';
import { WordPopover } from '@/components/tutor/WordPopover';
import type { PopoverData } from '@/components/tutor/WordPopover';
import { SessionSummary } from '@/components/tutor/SessionSummary';
import { SuggestionChips } from '@/components/tutor/SuggestionChips';
import { ChallengeModeToggle } from '@/components/tutor/ChallengeModeToggle';
import { SessionProgressBar } from '@/components/tutor/SessionProgressBar';
import { parseMessageContent, extractSuggestions } from '@/lib/tutor/message-parser';
import type { SuggestionOption } from '@/lib/tutor/message-parser';
import { TutorOnboarding, TUTOR_ONBOARDED_KEY } from '@/components/tutor/TutorOnboarding';
import type { ChallengeMode } from '@/lib/tutor/modes';
import { CHALLENGE_MODE_KEY } from '@/lib/tutor/modes';
import { useSpeechInput } from '@/lib/hooks/useSpeechInput';
import type { TutorRecommendation } from '@/app/api/tutor/recommendation/route';

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
  evaluation?: {
    strengths: string[];
    improvements: string[];
    tip: string;
  };
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
  recommendation?: TutorRecommendation | null;
  isLoadingRecommendation?: boolean;
  onStartGuidedSession?: (sceneId: string) => void;
  returnTo?: string | null;
  limitReached?: boolean;
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
  recommendation,
  isLoadingRecommendation,
  onStartGuidedSession,
  returnTo,
  limitReached,
}: TutorChatProps) {
  const [popover, setPopover] = useState<{ data: PopoverData; rect: DOMRect } | null>(null);
  const [vocabMap, setVocabMap] = useState(() => new Map<string, PopoverData>());
  const [vocabStatuses, setVocabStatuses] = useState(() => new Map<string, 'pending' | 'kept' | 'removed'>());
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !localStorage.getItem(TUTOR_ONBOARDED_KEY);
    } catch {
      return false;
    }
  });
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>(() => {
    if (typeof window === 'undefined') return 'easy';
    try {
      const stored = localStorage.getItem(CHALLENGE_MODE_KEY);
      if (stored === 'easy' || stored === 'medium' || stored === 'hard') return stored;
    } catch { /* ignore */ }
    return 'easy';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechLangCode = mapLanguageCode(langCode);
  const { isListening, transcript, audioLevel, startListening, stopListening } = useSpeechInput(speechLangCode);

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

  // Auto-scroll when keyboard opens/closes
  useEffect(() => {
    if (view !== 'chatting') return;
    const vv = window.visualViewport;
    if (!vv) return;

    function handleViewportResize() {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }

    vv.addEventListener('resize', handleViewportResize);
    return () => vv.removeEventListener('resize', handleViewportResize);
  }, [view]);

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

  const handleChallengeModeChange = useCallback((mode: ChallengeMode) => {
    setChallengeMode(mode);
    try { localStorage.setItem(CHALLENGE_MODE_KEY, mode); } catch { /* ignore */ }
  }, []);

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
    <div className={`flex flex-col h-full ${compact ? '' : 'pb-16'} ${className ?? ''}`}>
      {view === 'mode_select' && (
        showOnboarding ? (
          <TutorOnboarding onComplete={() => setShowOnboarding(false)} />
        ) : (
          <div className={compact ? 'px-3 pt-3' : 'px-4 pt-4'}>
            {!compact && <h1 className="text-2xl font-bold text-foreground mb-4">Tutor</h1>}
            <TutorHero
              recommendation={recommendation ?? null}
              onSelect={onStartSession}
              onStartGuided={onStartGuidedSession}
              disabled={isStarting}
              isLoading={isLoadingRecommendation}
            />
          </div>
        )
      )}

      {view === 'chatting' && (
        <>
          {/* Header */}
          <div className={`shrink-0 flex items-center justify-between ${compact ? 'px-3 py-2' : 'px-4 py-3'} border-b border-card-border`}>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className={`font-semibold text-foreground ${compact ? 'text-sm' : ''} shrink-0`}>Tutor</h2>
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
          {activeMode !== 'path_builder' && (
            <ChallengeModeToggle mode={challengeMode} onChange={handleChallengeModeChange} />
          )}

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
                  challengeMode={challengeMode}
                  isLoading={isStreaming && i === messages.length - 1 && msg.role === 'model' && msg.content === ''}
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

          {/* Bottom pinned section: chips + input */}
          <div className="shrink-0 overflow-hidden">
            {suggestionOptions.length > 0 ? (
              <SuggestionChips options={suggestionOptions} onSelect={onSendMessage} challengeMode={challengeMode} />
            ) : (
              !isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'model' && challengeMode !== 'hard' && (
                <div className="px-4 py-2">
                  <p className="text-xs text-text-secondary text-center">Try responding in the language you&apos;re learning, or type in English!</p>
                </div>
              )
            )}
            <ChatInput
              onSend={onSendMessage}
              disabled={isStreaming}
              isListening={isListening}
              transcript={transcript}
              audioLevel={audioLevel}
              onMicToggle={handleMicToggle}
            />
          </div>

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
            returnTo={returnTo}
            limitReached={limitReached}
          />
        </div>
      )}
    </div>
  );
}
