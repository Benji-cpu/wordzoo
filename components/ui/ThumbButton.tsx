'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useHaptic, type HapticPattern } from '@/lib/hooks/useHaptic';
import { useSound, type SoundName } from '@/lib/hooks/useSound';

type Variant = 'primary' | 'secondary' | 'success' | 'destructive' | 'ghost';
type Size = 'md' | 'lg';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  haptic?: HapticPattern | false;
  sound?: SoundName | false;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl ' +
  'transition-transform duration-150 ease-[var(--ease-spring)] ' +
  'active:scale-[0.97] select-none touch-manipulation ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-fox-ring)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

const SIZES: Record<Size, string> = {
  md: 'min-h-[56px] px-5 text-base',
  lg: 'min-h-[64px] px-6 text-lg',
};

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-white shadow-[var(--shadow-elevated)] ' +
    'bg-[var(--color-fox-primary)] hover:brightness-105 active:brightness-95',
  secondary:
    'bg-[var(--color-fox-soft)] text-[var(--color-fox-deep)] ' +
    'dark:text-[var(--color-fox-primary)] ' +
    'hover:brightness-[0.97] active:brightness-95',
  success:
    'bg-[var(--color-success)] text-white shadow-[var(--shadow-elevated)] ' +
    'hover:brightness-105 active:brightness-95',
  destructive:
    'bg-[var(--color-error)] text-white shadow-[var(--shadow-elevated)] ' +
    'hover:brightness-105 active:brightness-95',
  ghost:
    'bg-transparent text-foreground border border-border-default ' +
    'hover:bg-[var(--surface-inset)] active:bg-[var(--surface-inset)]',
};

export const ThumbButton = forwardRef<HTMLButtonElement, Props>(function ThumbButton(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = true,
    haptic = 'tap',
    sound = 'soft-tap',
    loading = false,
    leftIcon,
    rightIcon,
    className = '',
    onClick,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const hap = useHaptic();
  const snd = useSound();

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={(e) => {
        if (haptic) hap.trigger(haptic);
        if (sound) snd.play(sound);
        onClick?.(e);
      }}
      className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <LoadingDot />
      ) : (
        <>
          {leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
          <span>{children}</span>
          {rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
});

function LoadingDot() {
  return (
    <span className="inline-flex gap-1">
      <span className="w-2 h-2 rounded-full bg-current animate-[typing-dot_1.4s_infinite]" />
      <span
        className="w-2 h-2 rounded-full bg-current animate-[typing-dot_1.4s_infinite]"
        style={{ animationDelay: '0.2s' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-current animate-[typing-dot_1.4s_infinite]"
        style={{ animationDelay: '0.4s' }}
      />
    </span>
  );
}
