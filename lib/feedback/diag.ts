'use client';

/**
 * Lightweight diagnostic breadcrumb. Components dispatch a `wordzoo:diag`
 * CustomEvent for non-throwing failure modes (queue cursor invalid, missing
 * word in batch, etc.) — the activity-trail subscriber pushes them as
 * `error` events so they ride along with any feedback the user submits.
 *
 * No-op outside the browser; safe to call from any client component.
 */
export function emitDiag(message: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent('wordzoo:diag', { detail: { message: String(message).slice(0, 200) } }),
    );
  } catch {
    // CustomEvent unavailable — ignore.
  }
}
