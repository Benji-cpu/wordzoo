import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DailyRecapProps {
  yesterdayWords: number;
  yesterdayScenes: number;
  dueReviewCount: number;
}

export function DailyRecap({ yesterdayWords, yesterdayScenes, dueReviewCount }: DailyRecapProps) {
  if (yesterdayWords === 0 && yesterdayScenes === 0) return null;

  return (
    <Card size="compact">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-default/10 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-default">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            Yesterday: <span className="font-semibold">{yesterdayWords} word{yesterdayWords !== 1 ? 's' : ''}</span> across <span className="font-semibold">{yesterdayScenes} scene{yesterdayScenes !== 1 ? 's' : ''}</span>
            {dueReviewCount > 0 && (
              <span className="text-text-secondary">. {dueReviewCount} word{dueReviewCount !== 1 ? 's' : ''} due for review today.</span>
            )}
          </p>
          {dueReviewCount > 0 && (
            <Link href="/review" className="inline-block mt-2">
              <Button size="sm">Start Review</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
