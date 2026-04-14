'use client';

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function IconButton({
  children,
  onClick,
  label,
  className = '',
  size = 'md',
}: IconButtonProps) {
  const sizeClass = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${sizeClass} rounded-full flex items-center justify-center bg-surface-inset border border-card-border text-text-secondary hover:text-foreground hover:bg-surface-inset transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-accent-default focus-visible:outline-none ${className}`}
    >
      {children}
    </button>
  );
}
