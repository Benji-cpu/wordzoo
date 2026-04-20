'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { StudioMessage, StudioPathPreview } from '@/types/database';
import { StudioChat } from './StudioChat';
import { StudioInput } from './StudioInput';
import { StudioPreview } from './StudioPreview';

interface PathStudioClientProps {
  languageId: string;
  prefillScenario?: string;
  isPremium: boolean;
}

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  payment_failed: 'Payment didn’t go through. No charge was made — try again below.',
  generation_failed:
    'Payment succeeded but we couldn’t build your path. You won’t be charged again — retry below.',
  invalid_callback: 'Something went wrong returning from checkout. Try generating again below.',
};

export function PathStudioClient({ languageId, prefillScenario, isPremium }: PathStudioClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get('error');
  const initialErrorMessage = callbackError ? CALLBACK_ERROR_MESSAGES[callbackError] ?? null : null;

  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pathPreview, setPathPreview] = useState<StudioPathPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat');
  const [hasNewPreview, setHasNewPreview] = useState(false);
  const [error, setError] = useState<string | null>(initialErrorMessage);
  const [canGenerate, setCanGenerate] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/studio/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ languageId, prefillScenario }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || json.error) {
          setError(json.error ?? 'Failed to start studio session');
          return;
        }
        const { sessionId: sid, message } = json.data as {
          sessionId: string;
          message: StudioMessage;
        };
        setSessionId(sid);
        setMessages([message]);
        if (message.path_preview) {
          setPathPreview(message.path_preview);
        }
        if (message.intake_progress?.can_generate) {
          setCanGenerate(true);
        }
      } catch {
        if (!cancelled) setError('Failed to connect to studio. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    initSession();
    return () => { cancelled = true; };
  }, [languageId, prefillScenario]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!sessionId || isLoading) return;

      const userMessage: StudioMessage = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/studio/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          setError(json.error ?? 'Something went wrong');
          return;
        }
        const modelMessage = json.data as StudioMessage;
        setMessages((prev) => [...prev, modelMessage]);

        if (modelMessage.path_preview) {
          setPathPreview(modelMessage.path_preview);
          if (activeTab !== 'preview') {
            setHasNewPreview(true);
          }
        }
        if (modelMessage.intake_progress?.can_generate) {
          setCanGenerate(true);
        }
      } catch {
        setError('Failed to send message. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, activeTab]
  );

  // Handle visual element selections from RichMessage
  const handleVisualSelect = useCallback(
    async (messageIndex: number, elementIndex: number, selectedIds: string[]) => {
      if (!sessionId || isLoading) return;

      // Build a human-readable message from the selection
      const message = messages[messageIndex];
      const element = message?.visual_elements?.[elementIndex];
      if (!element) return;

      // Find labels for selected ids
      let selectionText = '';
      if (element.type === 'chips') {
        const chips = element.data as import('@/types/database').StudioChip[];
        const labels = selectedIds
          .map((id) => chips.find((c) => c.id === id)?.label)
          .filter(Boolean);
        selectionText = labels.join(', ');
      } else if (element.type === 'cards') {
        const cards = element.data as import('@/types/database').StudioCard[];
        const card = cards.find((c) => c.id === selectedIds[0]);
        selectionText = card?.title ?? selectedIds[0];
      }

      const userMessage: StudioMessage = {
        role: 'user',
        content: selectionText || selectedIds.join(', '),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/studio/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message: selectionText || selectedIds.join(', '),
            selections: selectedIds,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          setError(json.error ?? 'Something went wrong');
          return;
        }
        const modelMessage = json.data as StudioMessage;
        setMessages((prev) => [...prev, modelMessage]);

        if (modelMessage.path_preview) {
          setPathPreview(modelMessage.path_preview);
          if (activeTab !== 'preview') {
            setHasNewPreview(true);
          }
        }
        if (modelMessage.intake_progress?.can_generate) {
          setCanGenerate(true);
        }
      } catch {
        setError('Failed to send selection. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, messages, activeTab]
  );

  const [showPaywall, setShowPaywall] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!sessionId || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? 'Failed to generate path');
        return;
      }
      if (json.data?.needsPayment) {
        setShowPaywall(true);
        return;
      }
      const { path } = json.data as { path: import('@/types/database').Path };
      router.push(`/paths/${path.id}`);
    } catch {
      setError('Failed to generate path. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, isGenerating, router]);

  const handlePayPerPath = useCallback(async () => {
    if (!sessionId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/studio-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (!res.ok || json.error || !json.data?.url) {
        setError(json.error ?? 'Could not start checkout. Please try again.');
        setIsGenerating(false);
        return;
      }
      window.location.href = json.data.url;
    } catch {
      setError('Could not start checkout. Please try again.');
      setIsGenerating(false);
    }
  }, [sessionId]);

  function handleTabSwitch(tab: 'chat' | 'preview') {
    setActiveTab(tab);
    if (tab === 'preview') {
      setHasNewPreview(false);
    }
  }

  return (
    // The (app) layout wraps pages in <main className="flex-1 overflow-y-auto p-4 pb-20">
    // For studio we need full-height without that padding, so we use negative margins to break out
    <div className="-m-4 mb-0 h-[calc(100dvh-4rem-80px)] md:h-[calc(100dvh-4rem)] flex flex-col md:grid md:grid-cols-[1fr_1fr] md:gap-0">
      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-card-border bg-background flex-shrink-0">
        <button
          onClick={() => handleTabSwitch('chat')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-accent-default border-b-2 border-accent-default'
              : 'text-text-secondary'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => handleTabSwitch('preview')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'preview'
              ? 'text-accent-default border-b-2 border-accent-default'
              : 'text-text-secondary'
          }`}
        >
          Preview
          {hasNewPreview && activeTab !== 'preview' && (
            <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-accent-default animate-pulse" />
          )}
        </button>
      </div>

      {/* Chat panel */}
      <div
        className={`flex flex-col min-h-0 border-r border-card-border ${
          activeTab === 'chat' ? 'flex' : 'hidden'
        } md:flex`}
      >
        {/* Panel header (desktop only) */}
        <div className="hidden md:flex items-center px-4 py-3 border-b border-card-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Path Designer</h2>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex-shrink-0">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400/60 hover:text-red-400"
            >
              &times;
            </button>
          </div>
        )}

        {/* Messages */}
        <StudioChat
          messages={messages}
          isLoading={isLoading}
          onVisualSelect={handleVisualSelect}
        />

        {/* Input */}
        <StudioInput onSend={handleSend} disabled={isLoading || !sessionId} />
      </div>

      {/* Preview panel */}
      <div
        className={`flex flex-col min-h-0 ${
          activeTab === 'preview' ? 'flex' : 'hidden'
        } md:flex`}
      >
        {/* Panel header (desktop only) */}
        <div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-card-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Path Preview</h2>
          {hasNewPreview && (
            <span className="w-2 h-2 rounded-full bg-accent-default animate-pulse" />
          )}
        </div>

        <StudioPreview
          pathPreview={pathPreview}
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          isPremium={isPremium}
          onGenerate={handleGenerate}
        />
      </div>

      {showPaywall && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="studio-paywall-title"
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4"
          onClick={() => setShowPaywall(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card border border-card-border p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="studio-paywall-title" className="text-lg font-semibold text-foreground mb-2">
              Bring this path to life
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              Generate this custom path for a one-time $2.99, or upgrade to Premium for unlimited paths and more.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePayPerPath}
                disabled={isGenerating}
                className="w-full min-h-[48px] rounded-lg bg-accent-default text-white font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? 'Opening checkout…' : 'Generate this path — $2.99'}
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full min-h-[48px] rounded-lg border border-card-border text-foreground font-medium hover:bg-card-hover"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full min-h-[44px] text-sm text-text-secondary hover:text-foreground mt-1"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
