'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PreSceneReviewProps {
  dueCount: number;
  onStartReview: () => void;
  onSkip: () => void;
}

export function PreSceneReview({ dueCount, onStartReview, onSkip }: PreSceneReviewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <Card className="text-center max-w-sm w-full py-8">
        <p className="text-3xl mb-3">👋</p>
        <h2 className="text-lg font-bold text-foreground mb-2">
          Quick review first!
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          {dueCount} {dueCount === 1 ? 'word needs' : 'words need'} a quick refresher before new content.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={onStartReview}>Review Now</Button>
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </Card>
    </div>
  );
}
