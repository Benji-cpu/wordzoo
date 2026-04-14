interface ProgressBarProps {
  value: number; // 0–100
  accentColor?: string;
  className?: string;
  height?: 'sm' | 'md';
}

export function ProgressBar({
  value,
  accentColor = 'bg-accent-default',
  className = '',
  height = 'sm',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const heightClass = height === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={`w-full rounded-full bg-surface-inset ${heightClass} ${className}`}>
      <div
        className={`${heightClass} rounded-full ${accentColor} transition-all duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
