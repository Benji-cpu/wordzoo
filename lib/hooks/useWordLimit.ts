'use client';

import { useCallback, useEffect, useState } from 'react';
import { toastError } from '@/lib/ui/toast';

/**
 * Free-tier daily new-word limit, as the client sees it.
 *
 * Modelled on useTutorChat's limitReached / messagesRemaining pair, for the
 * same reason its comment gives: the learner must be told BEFORE they do work
 * that won't be saved, not after.
 *
 * The bug this exists to fix: /api/reviews/record returns 403 once the daily
 * limit is hit, and every call site in the scene flow was
 * `fetch(...).catch(() => {})`. So a free learner in a 25-word scene answered
 * all 25, the server kept 5, and the summary congratulated them for 25. The
 * words were simply gone.
 *
 * `remaining === null` means unlimited (premium, admin, or not yet known) and
 * must render as nothing at all — never as "0 left".
 */
export interface WordLimitState {
  remaining: number | null;
  limitReached: boolean;
  upgradeMessage: string | null;
  /**
   * Wrap a word-recording POST. Returns true only if the write actually
   * landed, so callers can count what was saved rather than what was shown.
   */
  recordWord: (url: string, body: unknown) => Promise<boolean>;
  /** For the introduce endpoint, which signals blocking as 200 + allowed:false. */
  markBlocked: (upgradeMessage: string | null) => void;
}

export function useWordLimit(): WordLimitState {
  const [remaining, setRemainingState] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  // Pre-seed from billing so the count is live before the learner hits the
  // wall. Premium and admin accounts stay at `null` = unlimited.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/billing/status')
      .then((res) => res.json())
      .then((res) => {
        if (cancelled || !res?.data) return;
        const { subscription, usage } = res.data;
        if (subscription?.tier === 'premium') return;
        const words = usage?.words_learned;
        if (!words || typeof words.limit !== 'number') return;
        setRemainingState(Math.max(0, words.limit - words.current));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const markBlocked = useCallback((message: string | null) => {
    setLimitReached(true);
    setRemainingState(0);
    setUpgradeMessage(message);
  }, []);

  const recordWord = useCallback(
    async (url: string, body: unknown): Promise<boolean> => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.status === 403) {
          const json = await res.json().catch(() => null);
          markBlocked(json?.error ?? null);
          return false;
        }

        if (!res.ok) {
          toastError("Couldn't save that answer — check your connection.");
          return false;
        }

        // Absent header means unlimited; only free accounts get a count.
        const header = res.headers.get('X-Words-Remaining');
        if (header !== null) {
          const parsed = Number(header);
          if (Number.isFinite(parsed)) setRemainingState(Math.max(0, parsed));
        }
        return true;
      } catch {
        toastError("Couldn't save that answer — check your connection.");
        return false;
      }
    },
    [markBlocked],
  );

  return { remaining, limitReached, upgradeMessage, recordWord, markBlocked };
}
