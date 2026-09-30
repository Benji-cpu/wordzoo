'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const subscribe = () => () => {};

/** The layout's slot element: null on the server and until the client has it. */
function useSlot(id: string): HTMLElement | null {
  return useSyncExternalStore(
    subscribe,
    () => document.getElementById(id),
    () => null,
  );
}

/** Text in the app header's centre slot (the layout owns the slot). */
export function HeaderPortal({ children }: { children: ReactNode }) {
  const slot = useSlot('header-center-slot');
  if (!slot) return null;
  return createPortal(children, slot);
}

/** The thin bar under the header. */
export function ProgressBarPortal({ current, total }: { current: number; total: number }) {
  const slot = useSlot('header-progress-slot');
  if (!slot) return null;
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return createPortal(
    <div className="h-0.5 bg-card-border">
      <div className="h-full bg-accent-id transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>,
    slot,
  );
}
