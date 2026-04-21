'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

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
 * Module-level XP store. All useXP() instances share the same state so
 * a SceneSummary's "+N XP earned" pill reflects every correct answer
 * awarded earlier in the same scene, not just the scene_complete bonus.
 */
let state: XpState = { total: 0, sessionEarned: 0 };
const listeners = new Set<() => void>();

function snapshot(): XpState {
  return state;
}

function serverSnapshot(): XpState {
  // Same reference every render on the server so React is happy.
  return SERVER_STATE;
}
const SERVER_STATE: XpState = { total: 0, sessionEarned: 0 };

function setState(next: XpState) {
  state = next;
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Client-side XP tracker. Shared module state across components.
 *
 * Optimistic: local state updates immediately, server persists async.
 * `sessionEarned` accumulates XP since the module was first loaded
 * (roughly "since this tab opened"); call `resetSession()` to zero it
 * at a meaningful boundary (e.g., entering a new scene).
 */
export function useXP() {
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
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
          setState({ ...state, total: body.data!.xp_total! });
        }
      } catch {
        // ignore — leaves total at 0 locally
      }
    })();
  }, []);

  const award = useCallback(
    async (reason: XpReason, amountOverride?: number) => {
      const amount = amountOverride ?? XP_AMOUNTS[reason];
      setState({
        total: state.total + amount,
        sessionEarned: state.sessionEarned + amount,
      });
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
    setState({ ...state, sessionEarned: 0 });
  }, []);

  return {
    total: value.total,
    sessionEarned: value.sessionEarned,
    award,
    resetSession,
  };
}
