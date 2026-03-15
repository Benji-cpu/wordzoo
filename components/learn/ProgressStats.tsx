import { Card } from '@/components/ui/Card';

interface ProgressStatsProps {
  wordsLearned: number;
  wordsMastered: number;
  streak: number;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  );
}

export function ProgressStats({ wordsLearned, wordsMastered, streak }: ProgressStatsProps) {
  return (
    <Card className="animate-fade-in">
      <div className="flex items-center justify-around">
        <Stat label="Learned" value={wordsLearned} />
        <div className="w-px h-8 bg-card-border" />
        <Stat label="Mastered" value={wordsMastered} />
        <div className="w-px h-8 bg-card-border" />
        <Stat label="Streak" value={`${streak}d`} />
      </div>
    </Card>
  );
}
