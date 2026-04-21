'use client';

import type { ReactNode } from 'react';

type Props = {
  /** Pinned top zone — progress + exit. Optional. */
  top?: ReactNode;
  /** Scrollable middle zone — main content. */
  children: ReactNode;
  /** Pinned bottom zone — primary action(s), thumb-zone padded. Optional. */
  bottom?: ReactNode;
  /** Whole-shell background override. */
  background?: string;
  className?: string;
};

/**
 * Three-zone layout contract for learn/review flows. Fills the
 * available viewport height so content never floats in the middle of
 * dead space. The bottom zone respects safe-area inset so the primary
 * action is always reachable by the thumb.
 *
 * Scrolling behavior: the middle zone scrolls; top and bottom stay
 * pinned. `min-h-0 flex-1` lets the middle shrink correctly inside a
 * flex column (prevents min-content overflow).
 */
export function SceneShell({
  top,
  bottom,
  children,
  background,
  className = '',
}: Props) {
  return (
    <div
      className={`flex flex-col w-full h-full min-h-full ${className}`.trim()}
      style={background ? { background } : undefined}
    >
      {top ? <div className="shrink-0 pb-2">{top}</div> : null}
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      {bottom ? (
        <div className="shrink-0 pt-3 thumb-zone">{bottom}</div>
      ) : null}
    </div>
  );
}
