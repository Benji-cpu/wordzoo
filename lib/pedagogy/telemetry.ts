/**
 * Pedagogy v2 telemetry. Fire-and-forget POST to /api/telemetry/pedagogy.
 * Console-logs in dev so we can watch the new flow without standing up a UI.
 */

/**
 * Every event that an emitter actually fires. Kept in exact sync with the
 * fireTelemetry call sites on purpose: the union used to declare 32 members
 * while only 16 had emitters, and /admin/pedagogy renders one row per event
 * name — so a phantom member shows up forever as a zero, which reads as
 * "learners never do this" rather than "nothing emits this".
 *
 * If you add a member here, add the call site in the same commit.
 *
 * Server-emitted events are NOT in this union — they are inserted directly
 * into pedagogy_events and never travel through fireTelemetry. Currently:
 *   srs_review_recorded  (lib/srs/engine.ts)
 */
export type PedagogyEvent =
  | 'drill_correct'
  | 'drill_wrong'
  | 'production_correct'
  | 'production_wrong'
  | 'cloze_correct'
  | 'cloze_wrong'
  | 'checkpoint_started'
  | 'checkpoint_passed'
  | 'checkpoint_failed'
  | 'remediation_loop_started'
  // Phrase-side analogues (round 3).
  | 'phrase_drill_correct'
  | 'phrase_drill_wrong'
  | 'phrase_checkpoint_started'
  | 'phrase_checkpoint_passed'
  | 'phrase_checkpoint_failed'
  | 'phrase_remediation_loop_started';

interface FireOptions {
  event: PedagogyEvent;
  payload?: Record<string, unknown>;
}

const isBrowser = typeof window !== 'undefined';
const isDev = process.env.NODE_ENV !== 'production';

export function fireTelemetry({ event, payload }: FireOptions): void {
  if (isDev) {
    console.log(`[pedagogy] ${event}`, payload ?? {});
  }
  if (!isBrowser) return;
  try {
    const body = JSON.stringify({ event, payload: payload ?? {}, ts: Date.now() });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/telemetry/pedagogy', blob);
    } else {
      fetch('/api/telemetry/pedagogy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* never throw from telemetry */
  }
}
