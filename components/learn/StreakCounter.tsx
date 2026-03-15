interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <span className="text-2xl" role="img" aria-label="streak fire">
        🔥
      </span>
      <div>
        <span className="text-lg font-bold text-foreground">{streak} day streak</span>
        <p className="text-xs text-text-secondary">Keep it going!</p>
      </div>
    </div>
  );
}
