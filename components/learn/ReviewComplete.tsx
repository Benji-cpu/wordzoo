'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ReviewCompleteProps {
  totalReviewed: number;
  correctCount: number;
  revisionCount?: number;
  revisionCorrectCount?: number;
}

export function ReviewComplete({ totalReviewed, correctCount, revisionCount = 0, revisionCorrectCount = 0 }: ReviewCompleteProps) {
  const router = useRouter();
  const didRevision = revisionCount > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
      <p className="text-4xl mb-4">{didRevision ? '💪' : '✅'}</p>
      <h2 className="text-xl font-bold text-foreground mb-1">All caught up!</h2>
      <p className="text-text-secondary mb-6">
        {didRevision
          ? 'Great job reinforcing those tricky words!'
          : 'Nice work on your reviews.'}
      </p>

      <Card className="w-full max-w-xs mb-4">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{totalReviewed}</p>
            <p className="text-xs text-text-secondary">Reviewed</p>
          </div>
          <div className="w-px bg-card-border" />
          <div>
            <p className="text-2xl font-bold text-green-400">{correctCount}</p>
            <p className="text-xs text-text-secondary">Remembered</p>
          </div>
        </div>
      </Card>

      {didRevision && (
        <Card className="w-full max-w-xs mb-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider text-center mb-3">Revision Round</p>
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{revisionCount}</p>
              <p className="text-xs text-text-secondary">Revised</p>
            </div>
            <div className="w-px bg-card-border" />
            <div>
              <p className="text-2xl font-bold text-green-400">{revisionCorrectCount}</p>
              <p className="text-xs text-text-secondary">Recalled</p>
            </div>
          </div>
        </Card>
      )}

      <Link
        href="/tutor?mode=word_review"
        className="block w-full max-w-xs rounded-xl bg-accent-default/5 border border-accent-default/15 p-4 hover:bg-accent-default/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-default flex-shrink-0">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-foreground">Practice in Conversation</p>
            <p className="text-xs text-text-secondary">Use your reviewed words in a chat</p>
          </div>
        </div>
      </Link>

      <Button onClick={() => router.push('/dashboard')} className="w-full max-w-xs mt-2">
        Back to Dashboard
      </Button>
    </div>
  );
}
