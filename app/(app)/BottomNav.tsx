'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useKeyboardVisible } from '@/lib/hooks/useKeyboardVisible';

const tabs = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/paths',
    label: 'Paths',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    href: '/review',
    label: 'Review',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: '/tutor',
    label: 'Tutor',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

interface BottomNavProps {
  onFeedbackTap: () => void;
}

export function BottomNav({ onFeedbackTap }: BottomNavProps) {
  const pathname = usePathname();
  const keyboardVisible = useKeyboardVisible();

  return (
    <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-card-border safe-area-bottom transition-transform duration-200 ${keyboardVisible ? 'translate-y-full' : ''}`}>
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map(tab => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-accent-id focus-visible:outline-none ${
                isActive ? 'text-accent-id' : 'text-text-secondary'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}

        {/* Feedback button (not a link — opens modal overlay) */}
        <button
          onClick={onFeedbackTap}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 transition-colors rounded-lg text-text-secondary hover:text-accent-id focus-visible:ring-2 focus-visible:ring-accent-id focus-visible:outline-none"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
          <span className="text-[10px] font-medium">Feedback</span>
        </button>
      </div>
    </nav>
  );
}
