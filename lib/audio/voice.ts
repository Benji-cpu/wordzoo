'use client';

import type { SupportedLanguageCode } from '@/types/audio';
import { playAudioDirect, getPlaybackSpeed } from './pronunciation';
import { getVoiceForLanguage, getEnglishVoice, speakWithPromise } from './voice-map';

/**
 * One way to say something out loud, used by everything.
 *
 * Before this there were three: pre-generated blob audio (good), the offline
 * seed pipeline (unreachable at runtime), and `new SpeechSynthesisUtterance()`
 * scattered across the app (robotic). Which one you got depended on which
 * component you happened to be looking at — the speaking session played every
 * word through the browser synthesiser even though a Google Neural clip existed
 * in Blob for all 642 of them.
 *
 * The order here is the whole point:
 *
 *   1. a URL we already have         — free, instant, the good voice
 *   2. /api/tts, cached by text hash  — the good voice for anything else,
 *                                       paid for once across all users
 *   3. the browser synthesiser        — last resort, so audio never goes silent
 *
 * Step 3 stays because step 2 needs a network and a billed key, and a learner
 * offline on a train should still hear something. But it is now the exception
 * rather than the default.
 */

type SpeakKind = 'word' | 'sentence';

/** Resolved TTS URLs for this tab. Same text, same clip, no second round-trip. */
const urlCache = new Map<string, string>();
/** In-flight requests, so ten cards mounting at once make one call. */
const inflight = new Map<string, Promise<string | null>>();

/**
 * Languages we have watched the route fail for. Sticky for the session: once
 * we know there is no voice or no key, every later line should go straight to
 * the browser rather than waiting on a round-trip that will fail again.
 */
const routeBlocked = new Set<string>();
const failures = new Map<string, number>();

/**
 * Give up on a language after this many failures in a row.
 *
 * The failure that matters is not transient. Google TTS answers 403
 * BILLING_DISABLED the moment the project's billing lapses, and that stays true
 * for the whole session — but each attempt still costs a round-trip before the
 * browser voice takes over, so an unbounded retry turns every narration line
 * into a stall. Exactly the dead air that makes a lesson feel broken.
 */
const MAX_FAILURES = 2;

/**
 * How long to wait before giving up on a line and using the browser voice.
 *
 * A cache hit returns in well under a second. Anything slower than this is
 * either a cold synthesis or a service in trouble, and neither is worth
 * holding up a lesson for — the fallback is a worse voice, not silence.
 */
const TTS_TIMEOUT_MS = 3500;

function noteFailure(lang: string): void {
  const next = (failures.get(lang) ?? 0) + 1;
  failures.set(lang, next);
  if (next >= MAX_FAILURES) routeBlocked.add(lang);
}

function cacheKey(text: string, lang: string, kind: SpeakKind): string {
  return `${lang}|${kind}|${text}`;
}

async function resolveTtsUrl(
  text: string,
  lang: string,
  kind: SpeakKind,
): Promise<string | null> {
  const key = cacheKey(text, lang, kind);
  const hit = urlCache.get(key);
  if (hit) return hit;
  if (routeBlocked.has(lang)) return null;

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang, kind }),
        signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
      });
      if (!res.ok) {
        // 400 means this language has no configured voice, which cannot change
        // during the session. Everything else gets MAX_FAILURES attempts before
        // we stop asking — enough to ride out a blip, few enough that a dead
        // key doesn't put a round-trip in front of every line.
        if (res.status === 400) routeBlocked.add(lang);
        else noteFailure(lang);
        return null;
      }
      const json = await res.json();
      const url = json?.data?.url as string | undefined;
      if (!url) {
        noteFailure(lang);
        return null;
      }
      failures.delete(lang);
      urlCache.set(key, url);
      return url;
    } catch {
      // Includes the timeout above: a slow voice is a stalled lesson.
      noteFailure(lang);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}

async function browserFallback(text: string, lang: string): Promise<void> {
  const voice =
    lang === 'en'
      ? await getEnglishVoice()
      : await getVoiceForLanguage(lang as SupportedLanguageCode);
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.rate = getPlaybackSpeed();
  await speakWithPromise(utterance);
}

interface SpeakOptions {
  /** A clip we already have — always preferred, never re-synthesized. */
  audioUrl?: string | null;
  /** Isolated vocabulary is spoken slower than connected speech. */
  kind?: SpeakKind;
}

/**
 * Say `text` in `lang`, resolving through the ladder above.
 *
 * Resolves when playback finishes, so callers can sequence lines. Never
 * rejects: a voice failing is not worth taking a lesson down for, and every
 * caller of the old code had to remember to catch.
 */
export async function speak(
  text: string,
  lang: string,
  options: SpeakOptions = {},
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const { audioUrl, kind = 'sentence' } = options;

  if (audioUrl) {
    try {
      return await playAudioDirect(audioUrl);
    } catch {
      // The clip is missing or Blob is down — carry on down the ladder rather
      // than leaving the learner in silence.
    }
  }

  const url = await resolveTtsUrl(trimmed, lang, kind);
  if (url) {
    try {
      return await playAudioDirect(url);
    } catch {
      // Fall through to the browser voice.
    }
  }

  try {
    await browserFallback(trimmed, lang);
  } catch {
    // Nothing left to try.
  }
}

/**
 * Warm the cache for lines we know are coming, without playing them.
 *
 * The hands-free session says the same handful of English lines on every word;
 * fetching them during the first silence means the second word does not pause
 * while a round-trip completes. Fire-and-forget by design.
 */
export function prewarm(lines: Array<{ text: string; lang: string; kind?: SpeakKind }>): void {
  for (const line of lines) {
    const trimmed = line.text.trim();
    if (trimmed) void resolveTtsUrl(trimmed, line.lang, line.kind ?? 'sentence');
  }
}
