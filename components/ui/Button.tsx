'use client';

import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'inverse' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  href?: string;
}

const variantStyles = {
  primary: 'bg-accent-default text-white hover:brightness-110 active:scale-[0.97]',
  secondary: 'bg-card-surface border border-card-border text-foreground hover:bg-surface-inset active:scale-[0.97]',
  ghost: 'bg-transparent text-text-secondary hover:text-foreground hover:bg-surface-inset',
  inverse: 'bg-foreground text-background hover:opacity-90',
  outline: 'border border-card-border text-foreground hover:bg-card-surface bg-transparent',
};

const sizeStyles = {
  sm: 'px-3 py-2 text-sm min-h-[36px]',
  md: 'px-5 py-3 text-base min-h-[44px]',
  lg: 'px-6 py-4 text-lg min-h-[52px]',
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
  const classes = `rounded-xl font-medium transition-all text-center ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
