'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useKeyboardVisible } from '@/lib/hooks/useKeyboardVisible';
import { NavIcon, type NavIconName } from './NavIcons';

type Tab =
  | { kind: 'link'; href: string; label: string; icon: NavIconName }
  | { kind: 'action'; label: string; icon: NavIconName };

const tabs: Tab[] = [
  { kind: 'link', href: '/dashboard', label: 'Home', icon: 'home' },
  { kind: 'link', href: '/paths', label: 'Paths', icon: 'paths' },
  { kind: 'link', href: '/review', label: 'Review', icon: 'review' },
  { kind: 'link', href: '/tutor', label: 'Tutor', icon: 'tutor' },
  { kind: 'action', label: 'Feedback', icon: 'feedback' },
];

interface BottomNavProps {
  onFeedbackTap: () => void;
}

export function BottomNav({ onFeedbackTap }: BottomNavProps) {
  const pathname = usePathname();
  const keyboardVisible = useKeyboardVisible();

  return (
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-200 ${
        keyboardVisible ? 'translate-y-full' : ''
      }`}
      style={{
        background: 'color-mix(in srgb, var(--background) 94%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)',
      }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto px-1 pt-1.5 pb-1.5">
        {tabs.map((tab, i) => {
          const isActive =
            tab.kind === 'link' &&
            (pathname === tab.href || pathname.startsWith(tab.href + '/'));

          const content = (
            <div className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-full transition-all">
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--nav-active-soft)' }}
                />
              )}
              <span
                className="relative z-10 flex items-center justify-center"
                style={{ color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
              >
                <NavIcon name={tab.icon} filled={isActive} size={22} />
              </span>
              <span
                className="relative z-10 text-[10px] font-extrabold tracking-wide"
                style={{ color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
              >
                {tab.label}
              </span>
            </div>
          );

          const sharedClass =
            'flex-1 min-w-0 flex justify-center items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] rounded-full';

          if (tab.kind === 'link') {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={sharedClass}
                aria-current={isActive ? 'page' : undefined}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={`action-${i}`}
              type="button"
              onClick={onFeedbackTap}
              className={sharedClass}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
