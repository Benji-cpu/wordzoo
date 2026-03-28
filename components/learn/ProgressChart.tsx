import type { MasteryDistribution } from '@/lib/db/queries';

const TIERS = [
  { key: 'learning_count' as const, label: 'Learning', color: 'bg-blue-400' },
  { key: 'reviewing_count' as const, label: 'Reviewing', color: 'bg-amber-400' },
  { key: 'mastered_count' as const, label: 'Mastered', color: 'bg-green-500' },
];

export function ProgressChart({ distribution, streak }: { distribution: MasteryDistribution; streak: number }) {
  const active = distribution.total_count - distribution.new_count;

  return (
    <div className="p-4 rounded-xl bg-card-surface border border-card-border space-y-3">
      {/* Mastery Bar */}
      {active > 0 ? (
        <div>
          <div className="flex h-3 rounded-full overflow-hidden bg-background">
            {TIERS.map(tier => {
              const pct = (distribution[tier.key] / active) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={tier.key}
                  className={`${tier.color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap justify-between gap-y-1 mt-2">
            {TIERS.map(tier => (
              <div key={tier.key} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${tier.color}`} />
                <span className="text-xs text-text-secondary">
                  {tier.label}: {distribution[tier.key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary text-center">Start learning to see your progress!</p>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-foreground">{active}</p>
          <p className="text-xs text-text-secondary">Words Active</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{distribution.mastered_count}</p>
          <p className="text-xs text-text-secondary">Mastered</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{streak}d</p>
          <p className="text-xs text-text-secondary">Streak</p>
        </div>
      </div>
    </div>
  );
}
