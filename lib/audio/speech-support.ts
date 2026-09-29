/**
 * One place that answers "can this browser actually transcribe speech?"
 *
 * The constructor existing is not the same as the feature working. Brave ships
 * `webkitSpeechRecognition` but holds no licence for Google's proprietary
 * speech service, so `start()` succeeds and the session dies a fraction of a
 * second later with a `network` error. Plain feature-detection therefore
 * reports a capability the browser does not have, and the learner sees a mic
 * that switches itself off the instant they tap it — which reads as "the app is
 * broken", not "this browser can't do this".
 *
 * So we detect it the only way that is actually true: watch for the failure,
 * remember it briefly, and say plainly whose limitation it is. Runtime
 * evidence beats UA sniffing here — the day Brave ships its own speech service
 * this stops lying in the other direction, and because the latch expires after
 * ten minutes it re-tests rather than staying stuck on a stale verdict.
 */

const BLOCKED_KEY = 'wordzoo_speech_service_blocked';
const FAILS_KEY = 'wordzoo_speech_immediate_fails';

/** The latch is a guess about the browser, so it expires and gets re-tested. */
export const BLOCK_TTL_MS = 10 * 60 * 1000;
/** A failure this soon after start(), with no audio ever opened, is "immediate". */
export const IMMEDIATE_FAILURE_MS = 1500;

/**
 * Brave exposes `navigator.brave`. The documented probe is the async
 * `isBrave()`, but the object's mere presence is enough to identify Brave and
 * — unlike the promise — it answers synchronously, which is what every caller
 * here needs (error handlers and render-time capability checks).
 */
export function isBraveBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return !!(navigator as Navigator & { brave?: unknown }).brave;
}

function isFirefox(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.includes('Firefox');
}

function readNumber(key: string): number {
  try {
    return Number(sessionStorage.getItem(key)) || 0;
  } catch {
    // Private mode / storage disabled — just re-test each time.
    return 0;
  }
}

function writeValue(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Best effort — the in-flight attempt still reports the right reason.
  }
}

/** True while a recent run of immediate failures says the service is not there. */
export function isSpeechServiceBlocked(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  const at = readNumber(BLOCKED_KEY);
  if (!at) return false;
  if (Date.now() - at < BLOCK_TTL_MS) return true;
  writeValue(BLOCKED_KEY, null);
  writeValue(FAILS_KEY, null);
  return false;
}

/**
 * Latch speech off outright. Prefer `recordSpeechFailure`: one 'network' error
 * on a phone is a dropped connection, not proof the browser lacks the service.
 */
export function markSpeechServiceBlocked(): void {
  if (typeof sessionStorage === 'undefined') return;
  writeValue(BLOCKED_KEY, String(Date.now()));
}

/**
 * Report a failed recognition session and say whether it latched speech off.
 *
 * Only a failure that is immediate (recognition died within
 * `IMMEDIATE_FAILURE_MS` of start with no audio ever opened) says anything about
 * the browser, and even then it latches only on a browser known to lack the
 * service (Brave, Firefox) or on the second immediate failure in a row.
 * Anything slower, or with audio already flowing, is a transient error: retry.
 */
export function recordSpeechFailure(info: { msSinceStart: number; audioStarted: boolean }): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  const immediate = !info.audioStarted && info.msSinceStart < IMMEDIATE_FAILURE_MS;
  if (!immediate) {
    writeValue(FAILS_KEY, null);
    return false;
  }
  const fails = readNumber(FAILS_KEY) + 1;
  writeValue(FAILS_KEY, String(fails));
  if (isBraveBrowser() || isFirefox() || fails >= 2) {
    markSpeechServiceBlocked();
    return true;
  }
  return false;
}

/** Audio opened, so the service exists: forget any run of immediate failures. */
export function recordSpeechSuccess(): void {
  if (typeof sessionStorage === 'undefined') return;
  writeValue(FAILS_KEY, null);
}

/**
 * Why speech input is unavailable, in words a learner can act on.
 *
 * Names the browser, because "we couldn't hear you" invites them to try again
 * and speak louder at a service that was never going to answer. Every branch
 * offers the way out that always works: type it.
 */
export function speechUnavailableMessage(): string {
  if (isBraveBrowser()) {
    return "Brave can't transcribe speech — it has no licence for the speech service, and there's no Brave setting that turns it on. Use Chrome or Edge for speaking practice, or type it instead.";
  }
  if (isFirefox()) {
    return "Firefox can't transcribe speech. Use Chrome, Edge, or Safari for speaking practice, or type it instead.";
  }
  return "This browser can't reach the speech service, so nothing was scored. Try Chrome, Edge, or Safari — or type it instead.";
}

/** A single failure that did not latch: say what happened, and that trying again is fine. */
export function speechRetryMessage(): string {
  return "Couldn't reach the speech service just then. Check your connection and tap the mic again, or type it instead.";
}
