'use client';

import { useState, useEffect, useCallback } from 'react';
import { TutorChat } from '@/components/tutor/TutorChat';
import type { SessionSummaryData } from '@/components/tutor/TutorChat';
import { useTutorChat } from '@/lib/hooks/useTutorChat';
import type { TutorRecommendation } from '@/app/api/tutor/recommendation/route';

export default function TutorPage() {
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

  const { messages, isStreaming, error, sendMessage, addGreeting } = useTutorChat(sessionId);

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
          }
        }
      } catch {
        // Fallback
      } finally {
        setIsLoadingLanguage(false);
      }
    }
    fetchLanguage();
  }, []);

  // Fetch recommendation when languageId is available and no active session
  useEffect(() => {
    if (!languageId || sessionId) return;
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
  }, [languageId, sessionId]);

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
      try {
        const res = await fetch('/api/tutor/guided-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sceneId }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          setActiveMode(null);
          throw new Error(json.error ?? 'Failed to start guided session');
        }
        setSessionId(json.data.sessionId);
        addGreeting(json.data.greeting);
      } catch (err) {
        console.error('Start guided session error:', err);
      } finally {
        setIsStarting(false);
      }
    },
    [addGreeting]
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
    setActiveMode(null);
    setRecommendation(null);
  }, []);

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
    <div className="max-w-lg mx-auto">
      <TutorChat
        languageId={languageId}
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
        activeMode={activeMode}
        recommendation={recommendation}
        isLoadingRecommendation={isLoadingRecommendation}
        onStartGuidedSession={handleStartGuidedSession}
      />
    </div>
  );
}
