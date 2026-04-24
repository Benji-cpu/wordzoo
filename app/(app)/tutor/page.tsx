'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { TutorChat } from '@/components/tutor/TutorChat';
import type { SessionSummaryData } from '@/components/tutor/TutorChat';
import { useTutorChat } from '@/lib/hooks/useTutorChat';
import { InsightCard } from '@/components/insights/InsightCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { getEligibleInsight } from '@/lib/insights/engine';
import { INSIGHTS } from '@/lib/insights/data';
import type { InsightDefinition } from '@/lib/insights/data';
import type { TutorRecommendation } from '@/app/api/tutor/recommendation/route';

export default function TutorPage() {
  const searchParams = useSearchParams();
  const sceneIdParam = searchParams.get('sceneId');
  const returnToParam = searchParams.get('returnTo');
  const returnTo = returnToParam && returnToParam.startsWith('/') ? returnToParam : null;

  const [initialMode, setInitialMode] = useState<string | undefined>(undefined);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [langCode, setLangCode] = useState('en');
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [summaryData, setSummaryData] = useState<SessionSummaryData | null>(null);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<TutorRecommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [guidedError, setGuidedError] = useState<string | null>(null);
  const [tutorInsight, setTutorInsight] = useState<InsightDefinition | null>(null);

  // Defined before useTutorChat so it can be passed as onAutoEnd callback
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

  const { messages, isStreaming, error, limitReached, sendMessage, addGreeting, loadMessages } = useTutorChat(sessionId, handleEndSession);

  // When limit is reached, auto-end the session to show summary
  useEffect(() => {
    if (limitReached && sessionId && !summaryData && !isEnding) {
      handleEndSession();
    }
  }, [limitReached, sessionId, summaryData, isEnding, handleEndSession]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const scene = params.get('sceneId');
    if (mode && !scene) setInitialMode(mode);
  }, []);

  useEffect(() => {
    async function fetchLanguage() {
      try {
        const res = await fetch('/api/paths/active');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.languageId) {
            setLanguageId(json.data.languageId);
            if (json.data.languageCode) {
              setLangCode(json.data.languageCode);
            }
          } else {
            // Tutor will default to English — warn so the user isn't silently misaligned
            import('sonner').then(({ toast }) =>
              toast.warning("Couldn't detect your learning language. The tutor will default to English.")
            );
          }
        }
      } catch {
        import('sonner').then(({ toast }) =>
          toast.warning("Couldn't detect your learning language. The tutor will default to English.")
        );
      } finally {
        setIsLoadingLanguage(false);
      }
    }
    fetchLanguage();
  }, []);

  // Check for active (resumable) session when languageId is available
  // Skip if coming from scene handoff (sceneIdParam) — we'll start a fresh guided session
  useEffect(() => {
    if (!languageId || sessionId || sceneIdParam) {
      setIsCheckingSession(false);
      return;
    }
    async function checkActiveSession() {
      try {
        const res = await fetch(`/api/tutor/session/active?languageId=${languageId}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.data) {
          setSessionId(json.data.session.id);
          setActiveMode(json.data.session.mode);
          loadMessages(json.data.messages.map((m: { role: 'user' | 'model'; content: string }) => ({
            role: m.role,
            content: m.content,
          })));
        }
      } catch {
        // Non-critical — fall through to mode selection
      } finally {
        setIsCheckingSession(false);
      }
    }
    checkActiveSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageId]);

  // Fetch recommendation when languageId is available, no active session, and session check is done
  useEffect(() => {
    if (!languageId || sessionId || isCheckingSession) return;
    async function fetchRecommendation() {
      setIsLoadingRecommendation(true);
      try {
        const res = await fetch(`/api/tutor/recommendation?languageId=${languageId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setRecommendation(json.data);
          }
        }
      } catch {
        // Non-critical — fallback state will show
      } finally {
        setIsLoadingRecommendation(false);
      }
    }
    fetchRecommendation();
  }, [languageId, sessionId, isCheckingSession]);

  // Check for tutor_production insight on first tutor visit (no active session)
  useEffect(() => {
    if (sessionId || isCheckingSession || tutorInsight) return;
    async function checkTutorInsight() {
      try {
        const res = await fetch('/api/insights');
        if (!res.ok) return;
        const json = await res.json();
        if (!json.data) return;
        const insight = getEligibleInsight('tutor_first', {
          seenInsightIds: new Set(json.data.seenIds),
          insightsShownToday: json.data.shownToday,
          totalMnemonicsViewed: 0,
          totalScenesCompleted: 0,
          totalWordsLearned: 0,
        });
        if (insight) {
          setTutorInsight(insight);
          fetch('/api/insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ insightId: insight.id, action: 'shown' }),
          }).catch(() => {});
        }
      } catch {
        // Non-critical
      }
    }
    checkTutorInsight();
  }, [sessionId, isCheckingSession, tutorInsight]);

  const handleStartSession = useCallback(
    async (mode: string, scenario?: string) => {
      if (!languageId) return;
      setIsStarting(true);
      setActiveMode(mode);
      try {
        const res = await fetch('/api/tutor/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, languageId, scenario }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          setActiveMode(null);
          throw new Error(json.error ?? 'Failed to start session');
        }
        setSessionId(json.data.sessionId);
        addGreeting(json.data.greeting);
      } catch (err) {
        console.error('Start session error:', err);
        const message = err instanceof Error ? err.message : 'Could not start the tutor. Please try again.';
        import('sonner').then(({ toast }) => toast.error(message));
      } finally {
        setIsStarting(false);
      }
    },
    [languageId, addGreeting]
  );

  const handleStartGuidedSession = useCallback(
    async (sceneId: string) => {
      setIsStarting(true);
      setActiveMode('guided_conversation');
      setGuidedError(null);
      try {
        const res = await fetch('/api/tutor/guided-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sceneId }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          setActiveMode(null);
          setGuidedError(json.error ?? 'Could not start conversation. Please try again.');
          return;
        }
        setSessionId(json.data.sessionId);
        addGreeting(json.data.greeting);
      } catch (err) {
        console.error('Start guided session error:', err);
        setActiveMode(null);
        setGuidedError('Could not start conversation. Please try again.');
      } finally {
        setIsStarting(false);
      }
    },
    [addGreeting]
  );

  // Auto-start guided session when coming from scene summary
  useEffect(() => {
    if (sceneIdParam && languageId && !sessionId && !isStarting && !isCheckingSession) {
      handleStartGuidedSession(sceneIdParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdParam, languageId, isCheckingSession]);

  const handleNewSession = useCallback(() => {
    setSessionId(null);
    setSummaryData(null);
    setActiveMode(null);
    setRecommendation(null);
  }, []);

  if (isLoadingLanguage || (isCheckingSession && languageId)) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Tutor</h1>
        <p className="mt-2 text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!languageId) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8">
        <EmptyStateCard
          foxPose="thinking"
          title="Pick a language first"
          subtitle="The tutor learns alongside you — choose a path to get started."
          primary={{ label: 'Choose a learning path', href: '/paths' }}
          secondary={{ label: 'Back to home', href: '/dashboard' }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto -mt-4 -mb-20 h-[calc(100dvh-3.5rem)] overflow-hidden">
      {guidedError && !sessionId && (
        <div className="px-4 pt-2 pb-2">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{guidedError}</p>
            <button
              onClick={() => {
                setGuidedError(null);
                if (sceneIdParam) handleStartGuidedSession(sceneIdParam);
              }}
              className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {tutorInsight && !sessionId && !guidedError && (
        <div className="px-4 pt-2 pb-2">
          <InsightCard insight={tutorInsight} onDismiss={() => setTutorInsight(null)} />
        </div>
      )}
      <TutorChat
        languageId={languageId}
        langCode={langCode}
        initialMode={initialMode}
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
        activeMode={activeMode}
        recommendation={recommendation}
        isLoadingRecommendation={isLoadingRecommendation}
        onStartGuidedSession={handleStartGuidedSession}
        returnTo={returnTo}
        limitReached={limitReached}
      />
    </div>
  );
}
