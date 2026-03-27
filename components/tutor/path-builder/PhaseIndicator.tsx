'use client';

interface PhaseIndicatorProps {
  phase: string;
  description: string;
}

const PHASE_ICONS: Record<string, string> = {
  Discovery: '🔍',
  Vocabulary: '📝',
  Phrases: '💬',
  Dialogues: '🎭',
  Confirm: '✅',
};

export function PhaseIndicator({ phase, description }: PhaseIndicatorProps) {
  const icon = PHASE_ICONS[phase] ?? '📍';

  return (
    <div className="my-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-card-border" />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-default/10 border border-accent-default/20">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold text-accent-default uppercase tracking-wider">
            {phase}
          </span>
        </div>
        <div className="flex-1 h-px bg-card-border" />
      </div>
      {description && (
        <p className="text-center text-xs text-text-secondary mt-1.5">{description}</p>
      )}
    </div>
  );
}
