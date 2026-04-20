'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type XpReason =
  | 'correct_answer'
  | 'phrase_complete'
  | 'word_learned'
  | 'scene_complete'
  | 'review_session'
  | 'streak_milestone';

export const XP_AMOUNTS: Record<XpReason, number> = {
  correct_answer: 2,
  phrase_complete: 5,
  word_learned: 10,
  scene_complete: 25,
  review_session: 15,
  streak_milestone: 20,
};

type XpState = {
  total: number;
  sessionEarned: number;
};

/**
 * Client-side XP tracker.
 *
 * Optimistic: local state updates immediately, server persists async.
 * `sessionEarned` tracks XP earned since the hook mounted — useful for
 * session-summary "You earned X XP" displays. Server persistence is
 * best-effort; transient failures are ignored so the UI never blocks.
 */
export function useXP() {
  const [state, setState] = useState<XpState>({ total: 0, sessionEarned: 0 });
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/xp');
        if (!res.ok) return;
        const body = (await res.json()) as { data?: { xp_total?: number } };
        if (typeof body?.data?.xp_total === 'number') {
          setState((prev) => ({ ...prev, total: body.data!.xp_total! }));
        }
      } catch {
        // ignore — leaves total at 0 locally
      }
    })();
  }, []);

  const award = useCallback(
    async (reason: XpReason, amountOverride?: number) => {
      const amount = amountOverride ?? XP_AMOUNTS[reason];
      setState((prev) => ({
        total: prev.total + amount,
        sessionEarned: prev.sessionEarned + amount,
      }));
      try {
        await fetch('/api/xp', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ amount, reason }),
        });
      } catch {
        // optimistic — ignore network errors
      }
      return amount;
    },
    [],
  );

  const resetSession = useCallback(() => {
    setState((prev) => ({ ...prev, sessionEarned: 0 }));
  }, []);

  return {
    total: state.total,
    sessionEarned: state.sessionEarned,
    award,
    resetSession,
  };
}
