'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { parseMessageContent } from '@/lib/tutor/message-parser';
import type { ChatMessage } from '@/components/tutor/TutorChat';
import { InlineMarkdown } from '@/components/ui/InlineMarkdown';
import type { SessionEvaluation } from '@/types/database';

interface SessionSummaryProps {
  summary: {
    messageCount: number;
    userMessageCount: number;
    wordCount: number;
    wordsUsed: string[];
    durationMinutes: number;
    mode: string;
    srsReviewsRecorded?: number;
    wordsIntroduced?: number;
    accuracyRate?: number;
    evaluation?: SessionEvaluation;
  };
  onNewSession: () => void;
  onStartSession?: (mode: string) => void;
  mode?: string;
  messages?: ChatMessage[];
  returnTo?: string | null;
}

const MODE_LABELS: Record<string, string> = {
  free_chat: 'Free Chat',
  role_play: 'Role Play',
  word_review: 'Word Review',
  grammar_glimpse: 'Grammar',
  pronunciation_coach: 'Pronunciation',
  guided_conversation: 'Guided',
};

export function SessionSummary({ summary, onNewSession, onStartSession, mode, messages, returnTo }: SessionSummaryProps) {
  // Count corrections from model messages
  const correctionCount = useMemo(() => {
    if (!messages) return 0;
    let count = 0;
    for (const msg of messages) {
      if (msg.role !== 'model') continue;
      const segments = parseMessageContent(msg.content);
      for (const seg of segments) {
        if (seg.type === 'correction') count++;
      }
    }
    return count;
  }, [messages]);

  let sectionIndex = 0;

  return (
    <div className="space-y-4">
      <h2
        className="text-lg font-semibold text-foreground text-center animate-slide-up"
        style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
      >
        Session Complete
      </h2>

      <div
        className="grid grid-cols-2 gap-3 animate-slide-up"
        style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
      >
        <Card>
          <div className="text-2xl font-bold text-accent-default text-center">
            {summary.durationMinutes}
          </div>
          <div className="text-xs text-text-secondary text-center">minutes</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-accent-default text-center">
            {summary.userMessageCount}
          </div>
          <div className="text-xs text-text-secondary text-center">messages sent</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-accent-default text-center">
            {summary.wordCount}
          </div>
          <div className="text-xs text-text-secondary text-center">words practiced</div>
        </Card>
        {correctionCount > 0 ? (
          <Card>
            <div className="text-2xl font-bold text-orange-400 text-center">
              {correctionCount}
            </div>
            <div className="text-xs text-text-secondary text-center">corrections</div>
          </Card>
        ) : (
          <Card>
            <div className="text-base font-bold text-accent-default text-center truncate">
              {MODE_LABELS[summary.mode] ?? summary.mode}
            </div>
            <div className="text-xs text-text-secondary text-center">mode</div>
          </Card>
        )}
      </div>

      {/* SRS Integration Stats */}
      {(summary.srsReviewsRecorded != null && summary.srsReviewsRecorded > 0) && (
        <div
          className="grid grid-cols-3 gap-3 animate-slide-up"
          style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
        >
          <Card>
            <div className="text-2xl font-bold text-green-400 text-center">
              {summary.srsReviewsRecorded}
            </div>
            <div className="text-xs text-text-secondary text-center">SRS reviews</div>
          </Card>
          {summary.accuracyRate != null && (
            <Card>
              <div className="text-2xl font-bold text-accent-default text-center">
                {summary.accuracyRate}%
              </div>
              <div className="text-xs text-text-secondary text-center">accuracy</div>
            </Card>
          )}
          {summary.wordsIntroduced != null && summary.wordsIntroduced > 0 && (
            <Card>
              <div className="text-2xl font-bold text-blue-400 text-center">
                {summary.wordsIntroduced}
              </div>
              <div className="text-xs text-text-secondary text-center">new words</div>
            </Card>
          )}
        </div>
      )}

      {/* AI Evaluation */}
      {summary.evaluation && (
        <div
          className="space-y-3 animate-slide-up"
          style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
        >
          {/* Strengths */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-400">Strengths</span>
            </div>
            <ul className="space-y-1.5">
              {summary.evaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm text-text-secondary leading-snug"><InlineMarkdown text={s} /></li>
              ))}
            </ul>
          </Card>

          {/* Improvements */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
              <span className="text-sm font-medium text-orange-400">To improve</span>
            </div>
            <ul className="space-y-1.5">
              {summary.evaluation.improvements.map((s, i) => (
                <li key={i} className="text-sm text-text-secondary leading-snug"><InlineMarkdown text={s} /></li>
              ))}
            </ul>
          </Card>

          {/* Tip */}
          <Card>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              <div>
                <span className="text-sm font-medium text-blue-400">Tip: </span>
                <span className="text-sm text-text-secondary"><InlineMarkdown text={summary.evaluation.tip} /></span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {summary.wordsUsed.length > 0 && (
        <div
          className="animate-slide-up"
          style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
        >
          <Card>
            <div className="text-sm font-medium text-foreground mb-2">Words practiced</div>
            <div className="flex flex-wrap gap-1.5">
              {summary.wordsUsed.map((word) => (
                <span
                  key={word}
                  className="px-2 py-0.5 rounded-full bg-accent-default/10 text-accent-default text-xs font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div
        className="space-y-2 animate-slide-up"
        style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
      >
        {returnTo && (
          <Link href={returnTo} className="block">
            <Button className="w-full">
              {returnTo.startsWith('/learn/') ? 'Continue to Next Scene' : returnTo.startsWith('/paths/') ? 'Back to Path' : 'Dashboard'} →
            </Button>
          </Link>
        )}
        {mode && onStartSession && (
          <Button
            onClick={() => onStartSession(mode)}
            variant="secondary"
            className="w-full"
          >
            Practice Again ({MODE_LABELS[mode] ?? mode})
          </Button>
        )}
        <Button onClick={onNewSession} variant={returnTo ? 'secondary' : undefined} className="w-full">
          New Session
        </Button>
      </div>
    </div>
  );
}
