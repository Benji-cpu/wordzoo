import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface QuickReviewCardProps {
  dueCount: number;
}

export function QuickReviewCard({ dueCount }: QuickReviewCardProps) {
  return (
    <Link href="/review" className="block">
      <Card className="animate-fade-in hover:border-accent-id/30 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-id/20 flex items-center justify-center text-accent-id font-bold text-lg">
              {dueCount}
            </div>
            <div>
              <h3 className="text-foreground font-medium">
                {dueCount} {dueCount === 1 ? 'item' : 'items'} due for review
              </h3>
              <p className="text-sm text-text-secondary">Quick review to keep them fresh</p>
            </div>
          </div>
          <span className="text-accent-id text-sm font-medium">Review →</span>
        </div>
      </Card>
    </Link>
  );
}
