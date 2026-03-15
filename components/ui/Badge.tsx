interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'tier' | 'status';
  color?: string;
  className?: string;
}

const variantStyles = {
  default: 'bg-white/10 text-text-secondary',
  tier: 'bg-accent-default/20 text-accent-default',
  status: 'bg-green-500/20 text-green-400',
};

export function Badge({
  children,
  variant = 'default',
  color,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color ?? variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
