import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import type { Path } from '@/types/database';

interface PathCardProps {
  path: Path;
  wordCount: number;
  wordsCompleted: number;
  progress: number;
}

function tierLabel(type: Path['type']): string {
  switch (type) {
    case 'premade': return 'Premade';
    case 'custom': return 'Custom';
    case 'travel': return 'Travel';
  }
}

export function PathCard({ path, wordCount, wordsCompleted, progress }: PathCardProps) {
  return (
    <Card className="animate-fade-in">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-foreground">{path.title}</h3>
        <Badge variant={path.type === 'travel' ? 'tier' : 'default'}>
          {tierLabel(path.type)}
        </Badge>
      </div>
      {path.description && (
        <p className="text-sm text-text-secondary mb-3">{path.description}</p>
      )}
      <ProgressBar value={progress} accentColor="bg-accent-id" height="sm" />
      <p className="text-xs text-text-secondary mt-2">
        {wordsCompleted}/{wordCount} words
      </p>
    </Card>
  );
}
