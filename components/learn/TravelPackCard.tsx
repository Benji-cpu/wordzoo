import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OfflineBadge } from '@/components/offline/OfflineBadge';
import type { Path } from '@/types/database';

interface TravelPackCardProps {
  path: Path;
  wordCount: number;
}

export function TravelPackCard({ path, wordCount }: TravelPackCardProps) {
  return (
    <Card className="animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent-id/10 flex items-center justify-center text-xl">
          ✈️
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground">{path.title}</h3>
          {path.description && (
            <p className="text-sm text-text-secondary truncate">{path.description}</p>
          )}
        </div>
        <OfflineBadge pathId={path.id} />
        <Badge variant="tier">{wordCount} words</Badge>
      </div>
    </Card>
  );
}
