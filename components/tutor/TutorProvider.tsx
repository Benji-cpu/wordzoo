'use client';

import { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTutorChat } from '@/lib/hooks/useTutorChat';
import { TutorFAB } from '@/components/tutor/TutorFAB';
import { TutorPanel } from '@/components/tutor/TutorPanel';
import type { ChatMessage, SessionSummaryData } from '@/components/tutor/TutorChat';
import type { NudgeResult } from '@/lib/services/nudge-service';

export interface TutorContextValue {
  isOpen: boolean;
  openPanel: (mode?: string) => void;
  closePanel: () => void;
  togglePanel: () => void;
  activeNudge: NudgeResult | null;
  dismissNudge: () => void;
  languageId: string | null;
  sessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => void;
  startSession: (mode: string, scenario?: string) => void;
  endSession: () => void;
  summaryData: SessionSummaryData | null;
}

export const TutorContext = createContext<TutorContextValue | null>(null);

function parsePageContext(pathname: string): string {
  if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
  if (pathname.startsWith('/learn')) return 'learn';
  if (pathname.startsWith('/review')) return 'review';
  if (pathname.startsWith('/paths')) return 'paths';
  return 'other';
}

export function TutorProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [langCode, setLangCode] = useState('en');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [summaryData, setSummaryData] = useState<SessionSummaryData | null>(null);
  const [activeNudge, setActiveNudge] = useState<NudgeResult | null>(null);
  const [pendingMode, setPendingMode] = useState<string | undefined>(undefined);
  const [isOnline, setIsOnline] = useState(true);

  const { messages, isStreaming, error, sendMessage, addGreeting } = useTutorChat(sessionId);

  const isTutorPage = pathname === '/tutor';
  const pageContext = parsePageContext(pathname);
  const nudgePollRef = useRef<NodeJS.Timeout | null>(null);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch language from active path
  useEffect(() => {
    async function fetchLanguage() {
      try {
        const res = await fetch('/api/paths/active');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.languageId) {
            setLanguageId(json.data.languageId);
            if (json.data.languageCode) setLangCode(json.data.languageCode);
          }
        }
      } catch {
        // Non-critical
      }
    }
    fetchLanguage();
  }, []);

  // Nudge polling: on mount, on pathname change, and every 60s
  const fetchNudge = useCallback(async () => {
    if (!languageId || isTutorPage) return;
    try {
      const res = await fetch(`/api/tutor/nudge?languageId=${languageId}&page=${pageContext}`);
      if (res.ok) {
        const json = await res.json();
        setActiveNudge(json.data ?? null);
      }
    } catch {
      // Non-critical
    }
  }, [languageId, isTutorPage, pageContext]);

  useEffect(() => {
    fetchNudge();
  }, [fetchNudge]);

  useEffect(() => {
    nudgePollRef.current = setInterval(fetchNudge, 60000);
    return () => {
      if (nudgePollRef.current) clearInterval(nudgePollRef.current);
    };
  }, [fetchNudge]);

  // Session lifecycle
  const handleStartSession = useCallback(
    async (mode: string, scenario?: string) => {
      if (!languageId) return;
      setIsStarting(true);
      setPendingMode(undefined);
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
  }, []);

  const openPanel = useCallback((mode?: string) => {
    setIsOpen(true);
    if (mode) setPendingMode(mode);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setPendingMode(undefined);
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const dismissNudge = useCallback(async () => {
    if (!activeNudge) return;
    setActiveNudge(null);
    try {
      await fetch('/api/tutor/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudgeId: activeNudge.id, action: 'dismissed' }),
      });
    } catch {
      // Non-critical
    }
  }, [activeNudge]);

  const acceptNudge = useCallback(async () => {
    if (!activeNudge) return;
    const mode = activeNudge.suggestedMode;
    setActiveNudge(null);
    try {
      await fetch('/api/tutor/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudgeId: activeNudge.id, action: 'accepted' }),
      });
    } catch {
      // Non-critical
    }
    // Auto-start session with suggested mode
    handleStartSession(mode);
  }, [activeNudge, handleStartSession]);

  const contextValue: TutorContextValue = {
    isOpen,
    openPanel,
    closePanel,
    togglePanel,
    activeNudge,
    dismissNudge,
    languageId,
    sessionId,
    messages,
    isStreaming,
    sendMessage,
    startSession: handleStartSession,
    endSession: handleEndSession,
    summaryData,
  };

  return (
    <TutorContext.Provider value={contextValue}>
      {children}
      {/* Hide FAB and Panel when on /tutor page or offline */}
      {!isTutorPage && isOnline && (
        <>
          <TutorFAB
            onClick={togglePanel}
            activeNudge={activeNudge}
            hidden={isOpen}
          />
          <TutorPanel
            isOpen={isOpen}
            onClose={closePanel}
            languageId={languageId ?? ''}
            langCode={langCode}
            messages={messages}
            isStreaming={isStreaming}
            error={error}
            onSendMessage={sendMessage}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onNewSession={handleNewSession}
            sessionId={sessionId}
            isStarting={isStarting}
            isEnding={isEnding}
            summaryData={summaryData}
            activeNudge={activeNudge}
            onDismissNudge={dismissNudge}
            onAcceptNudge={acceptNudge}
            initialMode={pendingMode}
          />
        </>
      )}
    </TutorContext.Provider>
  );
}
