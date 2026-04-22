'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

interface SideNavProps {
  onFeedbackTap: () => void;
}

export function SideNav({ onFeedbackTap }: SideNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="hidden lg:flex flex-col w-56 px-3 py-4 gap-1 flex-shrink-0"
      style={{
        background: 'var(--background)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {tabs.map((tab, i) => {
        const isActive =
          tab.kind === 'link' &&
          (pathname === tab.href || pathname.startsWith(tab.href + '/'));

        const inner = (
          <div className="relative flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-extrabold transition-colors">
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
              <NavIcon name={tab.icon} filled={isActive} size={20} />
            </span>
            <span
              className="relative z-10"
              style={{ color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
            >
              {tab.label}
            </span>
          </div>
        );

        const sharedClass =
          'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)]';

        if (tab.kind === 'link') {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={sharedClass}
              aria-current={isActive ? 'page' : undefined}
            >
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={`action-${i}`}
            type="button"
            onClick={onFeedbackTap}
            className={`${sharedClass} text-left`}
          >
            {inner}
          </button>
        );
      })}

      <div className="flex-1" />

      <Link
        href="/settings"
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)]"
        aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
      >
        <div
          className="relative flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-extrabold transition-colors"
          style={{ color: 'var(--nav-inactive)' }}
        >
          <span className="flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span>Settings</span>
        </div>
      </Link>
    </nav>
  );
}
