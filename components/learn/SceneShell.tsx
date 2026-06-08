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
 * Scrolling behavior: the middle zone is the ONLY scroll container —
 * top and bottom stay pinned. `min-h-0 flex-1` lets the middle shrink
 * correctly inside a flex column (prevents min-content overflow), and
 * `overflow-y-auto` keeps tall content (long dialogue, expanded phrase
 * breakdowns, recap) scrollable WITHIN the scene instead of pushing the
 * page — so a primary action never slides below the fold or behind the
 * bottom nav. Interactive steps that surface their own CTA pin it with
 * `sticky bottom-0`; reading/chat content simply scrolls.
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
      className={`flex flex-col w-full h-full min-h-full overflow-x-hidden ${className}`.trim()}
      style={background ? { background } : undefined}
    >
      {top ? <div className="shrink-0 pb-2">{top}</div> : null}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain pb-3">{children}</div>
      {bottom ? (
        <div className="shrink-0 pt-3 thumb-zone">{bottom}</div>
      ) : null}
    </div>
  );
}
