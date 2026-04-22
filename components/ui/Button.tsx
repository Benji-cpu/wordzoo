'use client';

import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'inverse' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  href?: string;
}

const variantStyles = {
  // Warm default: soft cream-orange pill, foreground text
  primary:
    'bg-[color:var(--nav-active-soft)] text-[color:var(--nav-active)] hover:bg-[color:var(--accent-indonesian-soft)] hover:text-[color:var(--foreground)]',
  // Full-accent bright pill (use for headline CTAs)
  accent:
    'bg-[color:var(--accent-indonesian)] text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-indonesian)_35%,transparent)] hover:shadow-[0_6px_16px_color-mix(in_srgb,var(--accent-indonesian)_45%,transparent)]',
  secondary:
    'bg-[color:var(--card-surface)] border border-[color:var(--card-border)] text-[color:var(--foreground)] hover:bg-[color:var(--surface-inset)]',
  ghost:
    'bg-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--surface-inset)]',
  inverse:
    'bg-[color:var(--foreground)] text-[color:var(--background)] hover:opacity-95',
  outline:
    'bg-transparent border border-[color:var(--card-border)] text-[color:var(--foreground)] hover:bg-[color:var(--card-surface)]',
};

const sizeStyles = {
  sm: 'px-3 py-2 text-sm min-h-[36px] rounded-xl',
  md: 'px-5 py-3 text-base min-h-[44px] rounded-2xl',
  lg: 'px-6 py-4 text-lg min-h-[52px] rounded-2xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  href,
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center gap-2 font-extrabold text-center',
    'transition-[transform,box-shadow,background-color,color] duration-[var(--duration-micro)]',
    'ease-[var(--ease-spring)] active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
    variantStyles[variant],
    sizeStyles[size],
    disabled ? 'opacity-50 pointer-events-none' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
