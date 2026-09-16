'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '@/lib/ui/pace';

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
  /**
   * Identifies which stage of the flow is showing. When given, a change to it
   * carries the middle zone out and the next one in, instead of swapping the
   * contents between two frames.
   *
   * Opt-in: a caller that does not pass it renders exactly as before. Pass
   * something that changes once per stage — the phase name — and NOT something
   * that changes per item, or every word in a batch cross-fades and the scene
   * reads as slower than it is.
   */
  stageKey?: string;
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
  stageKey,
}: Props) {
  const reduced = useReducedMotion();

  return (
    <div
      className={`flex flex-col w-full h-full min-h-full overflow-x-hidden ${className}`.trim()}
      style={background ? { background } : undefined}
    >
      {top ? <div className="shrink-0 pb-2">{top}</div> : null}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain pb-3">
        {stageKey === undefined ? (
          children
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stageKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0 : MOTION.transition / 1000 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      {bottom ? (
        <div className="shrink-0 pt-3 thumb-zone">{bottom}</div>
      ) : null}
    </div>
  );
}
