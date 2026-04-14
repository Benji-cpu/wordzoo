interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  variant?: 'default' | 'interactive' | 'inset';
  size?: 'compact' | 'default' | 'spacious';
}

const variantStyles = {
  default: 'glass-card',
  interactive: 'glass-card hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-default)] transition-shadow',
  inset: 'bg-surface-inset border border-border-subtle rounded-2xl',
};

const sizeStyles = {
  compact: 'p-3',
  default: 'p-4',
  spacious: 'p-6',
};

export function Card({ children, className = '', style, onClick, variant = 'default', size = 'default' }: CardProps) {
  const effectiveVariant = onClick ? 'interactive' : variant;

  return (
    <div
      className={`${variantStyles[effectiveVariant]} ${sizeStyles[size]} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform focus-visible:ring-2 focus-visible:ring-accent-default focus-visible:outline-none' : ''} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
