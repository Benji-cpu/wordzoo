/**
 * Pedagogy v2 telemetry. Fire-and-forget POST to /api/telemetry/pedagogy.
 * Console-logs in dev so we can watch the new flow without standing up a UI.
 */

export type PedagogyEvent =
  | 'drill_correct'
  | 'drill_wrong'
  | 'production_attempt'
  | 'production_correct'
  | 'production_wrong'
  | 'cloze_attempt'
  | 'cloze_correct'
  | 'cloze_wrong'
  | 'checkpoint_started'
  | 'checkpoint_passed'
  | 'checkpoint_failed'
  | 'remediation_loop_started'
  | 'mastery_stage_promoted'
  | 'introduction_recorded'
  | 'introduction_blocked_daily_limit'
  | 'distractor_tier_used'
  | 'reveal_mask_dismissed'
  // Phrase-side analogues (round 3).
  | 'phrase_drill_correct'
  | 'phrase_drill_wrong'
  | 'phrase_production_attempt'
  | 'phrase_production_correct'
  | 'phrase_production_wrong'
  | 'phrase_cloze_attempt'
  | 'phrase_cloze_correct'
  | 'phrase_cloze_wrong'
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
