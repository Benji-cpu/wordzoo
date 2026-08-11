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
 * remember it for the session, and say plainly whose limitation it is. Runtime
 * evidence beats UA sniffing here — the day Brave ships its own speech service
 * this stops lying in the other direction, and because the flag is per-session
 * a new tab re-tests rather than staying stuck on a stale verdict.
 */

const BLOCKED_KEY = 'wordzoo_speech_service_blocked';

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

/** True once this session has watched the speech service refuse to run. */
export function isSpeechServiceBlocked(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(BLOCKED_KEY) === '1';
  } catch {
    // Private mode / storage disabled — just re-test each time.
    return false;
  }
}

/**
 * Record that recognition started and then immediately failed for reasons that
 * have nothing to do with the learner (no service, no licence, blocked host).
 * Callers use this to stop offering a mic that cannot work.
 */
export function markSpeechServiceBlocked(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(BLOCKED_KEY, '1');
  } catch {
    // Best effort — the in-flight attempt still reports the right reason.
  }
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
