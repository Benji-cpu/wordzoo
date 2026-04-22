'use client';

import { useEffect } from 'react';

/**
 * One-time cleanup shim for users who still have the old WordZoo service
 * worker registered. The SW was removed in Phase 0 (offline mode cut), but
 * existing browsers keep the registration indefinitely and continue to serve
 * stale chunks on every page load until it's explicitly unregistered.
 *
 * Mounting this component in the (app) layout fires the unregister + cache
 * purge on first paint. Running it repeatedly is a no-op once registrations
 * are gone, so it's safe to leave in place.
 */
export function UnregisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((r) => r.unregister());
      })
      .catch(() => {});

    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => keys.forEach((k) => caches.delete(k)))
        .catch(() => {});
    }
  }, []);

  return null;
}
