/**
 * Shared geometric nav icons — outline when inactive, solid-filled when active.
 * Two paths per icon (outline + filled); parent picks which to render via the
 * `filled` prop, so both states are drawn in the same family.
 */

export type NavIconName = 'home' | 'paths' | 'review' | 'tutor' | 'feedback';

interface NavIconProps {
  name: NavIconName;
  filled?: boolean;
  size?: number;
}

export function NavIcon({ name, filled = false, size = 22 }: NavIconProps) {
  const common = { width: size, height: size, viewBox: '0 0 24 24' };
  switch (name) {
    case 'home':
      return filled ? (
        <svg {...common} fill="currentColor">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
        </svg>
      ) : (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'paths':
      return filled ? (
        <svg {...common} fill="currentColor">
          <path d="M7 4a3 3 0 0 0-3 3c0 2 3 7 3 7s3-5 3-7a3 3 0 0 0-3-3zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10 6a3 3 0 0 0-3 3c0 2 3 7 3 7s3-5 3-7a3 3 0 0 0-3-3zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
          <path d="M8 8.5l8 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1.5 2.2" />
        </svg>
      ) : (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 7a2 2 0 1 1 4 0c0 2-2 5-2 5s-2-3-2-5z" />
          <path d="M15 17a2 2 0 1 1 4 0c0 2-2 5-2 5s-2-3-2-5z" />
          <path d="M8 8.5l8 7.5" strokeDasharray="1.5 2.2" />
        </svg>
      );
    case 'review':
      return filled ? (
        <svg {...common} fill="currentColor">
          <path d="M12 3a9 9 0 0 0-8.6 6.3.8.8 0 0 0 .75 1H5A7 7 0 0 1 17.3 7.8L15 10h6V4l-2 2A9 9 0 0 0 12 3zM3 14v6l2-2a9 9 0 0 0 15.6-3.3.8.8 0 0 0-.75-1H19a7 7 0 0 1-12.3 2.4L9 14H3z" />
        </svg>
      ) : (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12a8 8 0 0 1 14-5.3L20 5v5h-5" />
          <path d="M20 12a8 8 0 0 1-14 5.3L4 19v-5h5" />
        </svg>
      );
    case 'tutor':
      return filled ? (
        <svg {...common} fill="currentColor">
          <path d="M6 3a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h2v2.5a1 1 0 0 0 1.65.75L13.5 18H18a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm3 6.5h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2zm0 3.5h4a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2z" />
        </svg>
      ) : (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4 3v-3H6a2 2 0 0 1-2-2z" />
          <path d="M8.5 10h7" />
          <path d="M8.5 13.5h4.5" />
        </svg>
      );
    case 'feedback':
      return filled ? (
        <svg {...common} fill="currentColor">
          <path d="M11.1 3.5 8.6 8.6l-5.6 1a1 1 0 0 0-.55 1.7l4.1 4-.95 5.6a1 1 0 0 0 1.45 1.05L12 19.3l4.95 2.6a1 1 0 0 0 1.45-1.05l-.95-5.6 4.1-4a1 1 0 0 0-.55-1.7l-5.6-1-2.5-5.1a1 1 0 0 0-1.8 0z" />
        </svg>
      ) : (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 4 2.5 5.5 6 1L16 14.5l1 6-5-3-5 3 1-6L3.5 10.5l6-1z" />
        </svg>
      );
  }
}
