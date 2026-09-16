'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { motion } from 'framer-motion';
import { usePace } from '@/lib/hooks/usePace';
import { REVEAL_STEPS } from '@/lib/ui/pace';

interface RevealOptions {
  /** Milliseconds from the start of the sequence at which each beat lands. */
  steps?: readonly number[];
  /** Which repetition of this kind of thing this is — see `paceFor`. */
  unitIndex?: number;
  /** The learner's own multiplier, once that setting exists. */
  scale?: number;
  /** Restart the sequence from the top whenever this changes. */
  resetKey?: unknown;
  /** Fired once, when the last beat lands. */
  onReady?: () => void;
}

export interface Reveal<T extends HTMLElement = HTMLElement> {
  /**
   * How many beats have landed. `0` is the opening state, before any timer; the
   * sequence is finished at `steps.length`. Read it as "show everything up to
   * here" rather than as a phase name — that is what lets one primitive drive
   * reveals with different numbers of parts.
   */
  beat: number;
  ready: boolean;
  /** Land every remaining beat now. Idempotent. */
  complete: () => void;
  /** Attach to the tappable area. A tap mid-sequence calls `complete`. */
  containerProps: { onPointerDown: () => void };
  /** Attach to the thing the learner acts on next; it is scrolled into view. */
  affordanceRef: RefObject<T | null>;
}

/**
 * The app's one way of letting information arrive.
 *
 * Content lands in beats rather than all at once, the pace quickens with each
 * repetition, and whatever the learner has to act on next is brought to them
 * rather than left below the fold. All three behaviours were invented once, in the
 * onboarding demo, and existed nowhere else; this is that mechanism with the
 * specifics taken out.
 *
 * A tap lands every remaining beat immediately. Without it an auto-paced reveal
 * reads as a video you cannot skip — pleasant the first time and an obstacle by the
 * twentieth, which is the failure mode that makes people call this kind of thing
 * slow.
 */
export function useReveal<T extends HTMLElement = HTMLElement>({
  steps = REVEAL_STEPS,
  unitIndex = 0,
  scale = 1,
  resetKey,
  onReady,
}: RevealOptions = {}): Reveal<T> {
  const { t } = usePace({ unitIndex, scale });
  const [beat, setBeat] = useState(0);
  const affordanceRef = useRef<T | null>(null);
  const last = steps.length;

  // Held in a ref so that completing early, or a re-render, never fires it twice
  // and never leaves it unfired.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const firedRef = useRef(false);

  useEffect(() => {
    setBeat(0);
    firedRef.current = false;

    const timers = steps.map((at, i) => setTimeout(() => setBeat(i + 1), t(at)));
    return () => timers.forEach(clearTimeout);
    // `steps` is a module constant at every call site; listing it would restart
    // the sequence on every render for any caller that inlines an array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, t, last]);

  const complete = useCallback(() => setBeat(last), [last]);

  useEffect(() => {
    if (beat < last || firedRef.current) return;
    firedRef.current = true;
    onReadyRef.current?.();
    // The reveal grows downwards as each beat lands, so on a phone what the
    // learner has to do next ends up under the fold. Bring it to them.
    requestAnimationFrame(() =>
      affordanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
    );
  }, [beat, last]);

  return {
    beat,
    ready: beat >= last,
    complete,
    containerProps: {
      onPointerDown: () => {
        if (beat < last) complete();
      },
    },
    affordanceRef,
  };
}

/**
 * One beat's worth of content, entering the way everything else does.
 *
 * `show` rather than conditional rendering at the call site, so a beat that has not
 * landed yet still occupies its place in the tree and React does not remount the
 * subtree — which is what makes an image flash white when its beat arrives.
 */
export function RevealStep({
  show,
  children,
  from = 'below',
  className = '',
}: {
  show: boolean;
  children: ReactNode;
  /** Where it comes from. `below` for text, `scale` for images and cards. */
  from?: 'below' | 'scale' | 'fade';
  className?: string;
}) {
  const initial =
    from === 'scale' ? { opacity: 0, scale: 0.8 } : from === 'fade' ? { opacity: 0 } : { opacity: 0, y: 10 };
  const animate = from === 'scale' ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 };

  if (!show) return null;

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={from === 'scale' ? { type: 'spring', stiffness: 200, damping: 20 } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}
