'use client';

import { useEffect, useRef } from 'react';
import { TutorChat } from '@/components/tutor/TutorChat';
import type { ChatMessage, SessionSummaryData } from '@/components/tutor/TutorChat';
import type { NudgeResult } from '@/lib/services/nudge-service';

interface TutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
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
  activeNudge: NudgeResult | null;
  onDismissNudge: () => void;
  onAcceptNudge: () => void;
  initialMode?: string;
  activeMode?: string | null;
}

export function TutorPanel({
  isOpen,
  onClose,
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
  activeNudge,
  onDismissNudge,
  onAcceptNudge,
  initialMode,
  activeMode,
}: TutorPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[59] bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel: full-screen mobile, side panel desktop */}
      <div
        ref={panelRef}
        className={`fixed z-[60] bg-background transition-transform duration-300 ease-out
          inset-0 md:inset-auto md:top-0 md:right-0 md:h-full md:w-[400px] md:border-l md:border-card-border md:shadow-2xl
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
          <h2 className="text-lg font-semibold text-foreground">AI Tutor</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-card-surface transition-colors"
            aria-label="Close tutor panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nudge banner */}
        {activeNudge && !sessionId && (
          <div className="px-4 py-3 bg-accent-default/10 border-b border-card-border">
            <p className="text-sm text-foreground mb-2">{activeNudge.message}</p>
            <div className="flex gap-2">
              <button
                onClick={onAcceptNudge}
                className="px-3 py-1.5 rounded-lg bg-accent-default text-white text-xs font-medium"
              >
                Start
              </button>
              <button
                onClick={onDismissNudge}
                className="px-3 py-1.5 rounded-lg bg-card-surface border border-card-border text-text-secondary text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Chat body */}
        <div className="flex-1 h-[calc(100%-56px)] overflow-hidden">
          {languageId ? (
            <TutorChat
              languageId={languageId}
              langCode={langCode}
              messages={messages}
              isStreaming={isStreaming}
              error={error}
              onSendMessage={onSendMessage}
              onStartSession={onStartSession}
              onEndSession={onEndSession}
              onNewSession={onNewSession}
              sessionId={sessionId}
              isStarting={isStarting}
              isEnding={isEnding}
              summaryData={summaryData}
              compact
              initialMode={initialMode}
              activeMode={activeMode}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary text-sm">
              Start a learning path first to use the tutor.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
