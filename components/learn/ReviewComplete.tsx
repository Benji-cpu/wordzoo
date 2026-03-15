'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ReviewCompleteProps {
  totalReviewed: number;
  correctCount: number;
}

export function ReviewComplete({ totalReviewed, correctCount }: ReviewCompleteProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
      <p className="text-4xl mb-4">✅</p>
      <h2 className="text-xl font-bold text-foreground mb-1">All caught up!</h2>
      <p className="text-text-secondary mb-6">Nice work on your reviews.</p>

      <Card className="w-full max-w-xs mb-6">
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

      <Button onClick={() => router.push('/dashboard')} className="w-full max-w-xs">
        Back to Dashboard
      </Button>
    </div>
  );
}
