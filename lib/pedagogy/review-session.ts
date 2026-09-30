/**
 * The review sitting as a pure state machine.
 *
 * /review used to be one pass of self-rated flip cards. It is now an attempt-first
 * loop: every card is an answer (spoken or typed), the app grades it, and nothing
 * leaves the sitting until the engine says it is known, or it has had three goes
 * and is parked for next time. This file owns the rules; ReviewClient owns the
 * screen. No React, no fetch, no clock: `now` is always passed in, so the rules
 * can be tested to the millisecond.
 *
 * Vocabulary
 *   presentation  one card shown to the learner for one item
 *   first pass    the item's first graded presentation of the sitting
 *   re-ask        a later presentation of an item that is not known yet
 *   ladder        the phrase partial path: gap drill, then the whole phrase
 *
 * "N cards later" means N other cards come first when the queue is long enough;
 * near the end it is as far back as the queue allows.
 */

import { GATE_THRESHOLD } from '@/lib/pedagogy/gate';
import { normalizeForCompare, normalizeSentence, scoreRecall, similarity } from '@/lib/pedagogy/normalize';

export type Rating = 'forgot' | 'hard' | 'got_it';
export type ItemKind = 'word' | 'phrase';
export type Stage = 'teach' | 'first' | 'reask' | 'gap' | 'whole';
export type CardMode = 'say' | 'type' | 'listen' | 'teach';
export type Source = 'review' | 'practice';

/** Presentations of one item in one sitting, then it is parked (still due next time). */
export const MAX_PRESENTATIONS = 3;
/** Cards between a missed presentation and its re-ask. */
export const REASK_GAP = 5;
/** Phrase ladder: the gap drill, then the whole phrase from English. */
export const GAP_DRILL_GAP = 3;
export const WHOLE_GAP = 6;
/** A teach card, then its recall. */
export const TEACH_RECALL_GAP = 3;
/** A re-ask never comes back sooner than this after the answer. */
export const REASK_DELAY_MS = 20_000;
/** A learning item unseen for longer than this is taught again before it is asked. */
export const STALE_LEARNING_DAYS = 14;
/** Spoken answers looked at, and how many overrides tip the default to typing. */
export const OVERRIDE_WINDOW = 10;
export const OVERRIDE_LIMIT = 3;

const DAY_MS = 86_400_000;

export interface SittingItem {
  key: string;
  kind: ItemKind;
  id: string;
  /** < 2 is still learning; missing (practice rows) is treated as known. */
  learningStep: number;
  intervalDays: number;
  lastReviewedAt: string | Date | null;
  timesReviewed: number;
}

export function itemKey(kind: ItemKind, id: string): string {
  return `${kind}:${id}`;
}

export interface QueueEntry {
  id: number;
  key: string;
  stage: Stage;
  /** Epoch ms. The entry is not shown before this. */
  notBefore: number;
}

export interface ItemProgress {
  /** Graded presentations shown this sitting (a ladder is up to three). */
  presentations: number;
  /** POSTs made for this item; the next one is `posts + 1`. */
  posts: number;
  firstDone: boolean;
  /** The engine's verdict after the last POST; null until one has settled. */
  known: boolean | null;
  parked: boolean;
  lastRating: Rating | null;
  ladder: { missed: string[]; gapRight: boolean | null } | null;
  practiceRequeued: boolean;
}

export interface SessionState {
  source: Source;
  items: Record<string, SittingItem>;
  queue: QueueEntry[];
  current: QueueEntry | null;
  /** Set when everything left is a re-ask that is not due yet. */
  waitUntil: number | null;
  progress: Record<string, ItemProgress>;
  nextId: number;
  firstTotal: number;
}

export interface PostRequest {
  key: string;
  kind: ItemKind;
  id: string;
  rating: Rating;
  /** 1-based count of POSTs for this item this sitting (the API's `presentation`). */
  presentation: number;
}

export type PresentationResult =
  | { type: 'rated'; rating: Rating }
  | { type: 'partial'; missed: string[] };

// ---------------------------------------------------------------------------
// Ratings

export type Outcome =
  | { how: 'right'; tries: 1 | 2 }
  | { how: 'override' }
  | { how: 'listen'; correct: boolean }
  | { how: 'wrong' }
  | { how: 'idk' };

/**
 * First-try right is got_it; right on the second try, "I said it right" and a
 * correct multiple-choice listen are hard (recognised, not produced cold);
 * wrong and "I don't know" are forgot.
 */
export function ratingFor(outcome: Outcome): Rating {
  switch (outcome.how) {
    case 'right':
      return outcome.tries === 1 ? 'got_it' : 'hard';
    case 'override':
      return 'hard';
    case 'listen':
      return outcome.correct ? 'hard' : 'forgot';
    case 'wrong':
    case 'idk':
      return 'forgot';
  }
}

// ---------------------------------------------------------------------------
// The spoken-override tracker

/** Newest last, capped at the window. `true` = the learner overrode the recogniser. */
export function pushSpoken(history: readonly boolean[], overridden: boolean): boolean[] {
  return [...history, overridden].slice(-OVERRIDE_WINDOW);
}

/** When the recogniser keeps disagreeing with the learner, stop defaulting to it. */
export function tooManyOverrides(history: readonly boolean[]): boolean {
  return history.slice(-OVERRIDE_WINDOW).filter(Boolean).length >= OVERRIDE_LIMIT;
}

// ---------------------------------------------------------------------------
// Mode choice

export interface ModeContext {
  speechAvailable: boolean;
  recentSpoken: readonly boolean[];
  /** Four listen options could be built for this item. */
  canListen: boolean;
}

/**
 * say / type for production, listen for a graduated item now and then, teach
 * for a stale learning item. A re-ask and a learning item are never a listen:
 * a multiple-choice pick cannot show recall, and a re-ask must be recall.
 */
export function chooseMode(entry: QueueEntry, item: SittingItem, ctx: ModeContext): CardMode {
  if (entry.stage === 'teach') return 'teach';
  if (entry.stage === 'first' && item.learningStep >= 2 && item.timesReviewed % 3 === 2 && ctx.canListen) {
    return 'listen';
  }
  return ctx.speechAvailable && !tooManyOverrides(ctx.recentSpoken) ? 'say' : 'type';
}

// ---------------------------------------------------------------------------
// Building the sitting

/** Words two to one phrase, in the order the server sent each list. */
export function interleave<T>(words: readonly T[], phrases: readonly T[]): T[] {
  const out: T[] = [];
  let w = 0;
  let p = 0;
  while (w < words.length || p < phrases.length) {
    if (w < words.length) out.push(words[w++]);
    if (w < words.length) out.push(words[w++]);
    if (p < phrases.length) out.push(phrases[p++]);
  }
  return out;
}

export function isStaleLearning(item: SittingItem, now: number): boolean {
  if (item.learningStep >= 2 || item.lastReviewedAt == null) return false;
  const at = new Date(item.lastReviewedAt).getTime();
  return Number.isFinite(at) && now - at > STALE_LEARNING_DAYS * DAY_MS;
}

/**
 * Server order, with a teach card where a stale learning item sits and its
 * recall three cards after it.
 */
export function buildInitialQueue(
  ordered: readonly SittingItem[],
  opts: { now: number; teach: boolean },
): Array<{ key: string; stage: Stage }> {
  const out: Array<{ key: string; stage: Stage }> = [];
  const pending: Array<{ key: string; releaseAt: number }> = [];
  const flush = () => {
    while (pending.length > 0 && out.length >= pending[0].releaseAt) {
      out.push({ key: pending.shift()!.key, stage: 'first' });
    }
  };
  for (const item of ordered) {
    if (opts.teach && isStaleLearning(item, opts.now)) {
      out.push({ key: item.key, stage: 'teach' });
      pending.push({ key: item.key, releaseAt: out.length + TEACH_RECALL_GAP });
    } else {
      out.push({ key: item.key, stage: 'first' });
    }
    flush();
  }
  for (const p of pending) out.push({ key: p.key, stage: 'first' });
  return out;
}

function freshProgress(): ItemProgress {
  return {
    presentations: 0,
    posts: 0,
    firstDone: false,
    known: null,
    parked: false,
    lastRating: null,
    ladder: null,
    practiceRequeued: false,
  };
}

export function createSession(input: {
  items: readonly SittingItem[];
  source: Source;
  now: number;
}): SessionState {
  const items: Record<string, SittingItem> = {};
  const progress: Record<string, ItemProgress> = {};
  for (const item of input.items) {
    items[item.key] = item;
    progress[item.key] = freshProgress();
  }
  const base = buildInitialQueue(input.items, { now: input.now, teach: input.source === 'review' });
  const queue = base.map((e, i) => ({ id: i + 1, key: e.key, stage: e.stage, notBefore: 0 }));
  return startNext(
    {
      source: input.source,
      items,
      queue,
      current: null,
      waitUntil: null,
      progress,
      nextId: queue.length + 1,
      firstTotal: input.items.length,
    },
    input.now,
  );
}

// ---------------------------------------------------------------------------
// Queue moves

/** Put the first entry that is due on the table; otherwise say when to look again. */
export function startNext(state: SessionState, now: number): SessionState {
  if (state.current) return state;
  const idx = state.queue.findIndex((e) => e.notBefore <= now);
  if (idx >= 0) {
    return {
      ...state,
      current: state.queue[idx],
      queue: state.queue.filter((_, i) => i !== idx),
      waitUntil: null,
    };
  }
  if (state.queue.length === 0) return { ...state, waitUntil: null };
  return { ...state, waitUntil: Math.min(...state.queue.map((e) => e.notBefore)) };
}

export function isFinished(state: SessionState): boolean {
  return state.current === null && state.queue.length === 0;
}

function enqueue(state: SessionState, key: string, stage: Stage, gap: number, now: number): SessionState {
  const entry: QueueEntry = { id: state.nextId, key, stage, notBefore: now + REASK_DELAY_MS };
  const at = Math.min(gap, state.queue.length);
  const queue = [...state.queue.slice(0, at), entry, ...state.queue.slice(at)];
  return { ...state, queue, nextId: state.nextId + 1 };
}

/**
 * A POST settles after the learner has already moved on, so the card on the
 * table is one of the cards the re-ask has to wait behind.
 */
function gapAfterCurrent(state: SessionState): number {
  return Math.max(0, REASK_GAP - (state.current ? 1 : 0));
}

function makePost(item: SittingItem, p: ItemProgress, rating: Rating): PostRequest {
  p.posts += 1;
  p.lastRating = rating;
  return { key: item.key, kind: item.kind, id: item.id, rating, presentation: p.posts };
}

/** A teach card is not graded: it just goes away, and the recall is already queued. */
export function completeTeach(state: SessionState, now: number): SessionState {
  if (!state.current || state.current.stage !== 'teach') return state;
  return startNext({ ...state, current: null }, now);
}

/**
 * The learner finished the card on the table. Returns the next state and, when
 * this presentation is one the server should hear about, the POST to make.
 * A phrase's partial answer is not posted: it starts the ladder, and the one
 * rating goes out when the ladder ends.
 */
export function completePresentation(
  state: SessionState,
  result: PresentationResult,
  now: number,
): { state: SessionState; post: PostRequest | null } {
  const cur = state.current;
  if (!cur || cur.stage === 'teach') return { state, post: null };
  const item = state.items[cur.key];
  const p: ItemProgress = { ...state.progress[cur.key], presentations: state.progress[cur.key].presentations + 1 };
  if (cur.stage === 'first' || cur.stage === 'reask') p.firstDone = true;

  let next: SessionState = { ...state, current: null };
  let post: PostRequest | null = null;

  const ladderAllowed =
    result.type === 'partial' &&
    cur.stage === 'first' &&
    item.kind === 'phrase' &&
    p.posts === 0 &&
    state.source === 'review';

  if (result.type === 'partial' && ladderAllowed) {
    p.ladder = { missed: result.missed, gapRight: null };
    if (next.queue.length === 0) {
      // Nothing to space the drill against: post the partial as hard and stop.
      post = makePost(item, p, 'hard');
    } else {
      next = enqueue(next, cur.key, 'gap', GAP_DRILL_GAP, now);
    }
  } else {
    // A partial anywhere but the first look at a phrase counts as hard.
    const rating: Rating = result.type === 'partial' ? 'hard' : result.rating;
    if (cur.stage === 'gap') {
      const right = rating !== 'forgot';
      p.ladder = { missed: p.ladder?.missed ?? [], gapRight: right };
      if (next.queue.length === 0) {
        post = makePost(item, p, right ? 'hard' : 'forgot');
      } else {
        next = enqueue(next, cur.key, 'whole', WHOLE_GAP, now);
      }
    } else if (cur.stage === 'whole') {
      post = makePost(item, p, rating === 'forgot' ? 'forgot' : 'hard');
    } else {
      post = makePost(item, p, rating);
    }
  }

  next = { ...next, progress: { ...next.progress, [cur.key]: p } };
  return { state: startNext(next, now), post };
}

/**
 * The POST for `key` came back (or failed). Decide whether the item is done or
 * comes round again. A failed POST re-queues by the rating alone: got_it is
 * treated as known, anything else is not.
 */
export function settlePost(
  state: SessionState,
  key: string,
  rating: Rating,
  response: { ok: boolean; known?: boolean },
  now: number,
): SessionState {
  const prev = state.progress[key];
  if (!prev) return state;
  const p: ItemProgress = { ...prev };
  let next: SessionState = state;
  const others = state.queue.length + (state.current ? 1 : 0);

  if (state.source === 'practice') {
    // Practice never advances anything; a miss is asked once more, then left.
    p.known = rating !== 'forgot';
    if (rating === 'forgot' && !p.practiceRequeued && others > 0 && p.presentations < MAX_PRESENTATIONS) {
      p.practiceRequeued = true;
      next = enqueue(next, key, 'reask', gapAfterCurrent(next), now);
    }
  } else {
    const known = response.ok ? Boolean(response.known) : rating === 'got_it';
    p.known = known;
    if (!known) {
      if (p.presentations >= MAX_PRESENTATIONS || others === 0) {
        p.parked = true;
      } else {
        next = enqueue(next, key, 'reask', gapAfterCurrent(next), now);
      }
    }
  }

  next = { ...next, progress: { ...next.progress, [key]: p } };
  return startNext(next, now);
}

/**
 * Give up on what is left ("park it for next time"). A ladder that never got
 * its final rating still owes the server one, so those come back as posts.
 */
export function parkRemaining(state: SessionState): { state: SessionState; posts: PostRequest[] } {
  const progress = { ...state.progress };
  const posts: PostRequest[] = [];
  const waiting = [...(state.current ? [state.current] : []), ...state.queue];
  for (const entry of waiting) {
    const p: ItemProgress = { ...progress[entry.key] };
    if (p.known !== true) p.parked = true;
    if (p.ladder && p.posts === 0 && !posts.some((x) => x.key === entry.key)) {
      posts.push(makePost(state.items[entry.key], p, p.ladder.gapRight === false ? 'forgot' : 'hard'));
    }
    progress[entry.key] = p;
  }
  return { state: { ...state, queue: [], current: null, waitUntil: null, progress }, posts };
}

// ---------------------------------------------------------------------------
// Progress and the honest summary

export function progressOf(state: SessionState): { done: number; total: number; comingBack: number } {
  const done = Object.values(state.progress).filter((p) => p.firstDone).length;
  const isReask = (e: QueueEntry) => e.stage === 'reask' || e.stage === 'gap' || e.stage === 'whole';
  const comingBack = state.queue.filter(isReask).length + (state.current && isReask(state.current) ? 1 : 0);
  return { done, total: state.firstTotal, comingBack };
}

export interface SittingSummary {
  total: number;
  lockedIn: number;
  /** Not known at the end of the sitting; still due next time. */
  parked: number;
  /** Due items this sitting did not reach, plus the parked ones. */
  stillWaiting: number;
  /** stillWaiting expressed in sittings of `sittingSize`. */
  sittings: number;
  /** True when nothing fragile is left: safe to move on to new material. */
  canMoveOn: boolean;
}

export function summarize(
  state: SessionState,
  opts: {
    dueRemaining: number;
    sittingSize: number;
    /**
     * Fragile items (the gate's predicate) still due after this sitting. When
     * omitted, every item still waiting counts, which is the cautious default.
     */
    fragileRemaining?: number;
  },
): SittingSummary {
  const all = Object.values(state.progress);
  const lockedIn = all.filter((p) => p.firstDone && p.known === true).length;
  // Practice items are not due, so a miss there is not a debt. An item that was
  // parked before it was ever asked is still owed.
  const parked =
    state.source === 'practice'
      ? 0
      : all.filter((p) => p.known !== true && (p.firstDone || p.parked)).length;
  const stillWaiting = state.source === 'practice' ? 0 : opts.dueRemaining + parked;
  return {
    total: state.firstTotal,
    lockedIn,
    parked,
    stillWaiting,
    sittings: stillWaiting === 0 ? 0 : Math.ceil(stillWaiting / Math.max(1, opts.sittingSize)),
    canMoveOn: parked === 0 && (opts.fragileRemaining ?? stillWaiting) <= GATE_THRESHOLD,
  };
}

/** The gate's fragile predicate: still in the learning steps, or on an interval of 3 days or less. */
export function isFragile(item: Pick<SittingItem, 'learningStep' | 'intervalDays'>): boolean {
  return item.learningStep < 2 || item.intervalDays <= 3;
}

/**
 * Fragile items still due once this sitting is done: the uncapped fragile total
 * minus the sitting's items that were fragile when it loaded (the sitting can
 * also hold mature catch-up items, so its size is not the number to subtract).
 */
export function fragileRemaining(fragileDueTotal: number, sitting: readonly SittingItem[]): number {
  return Math.max(0, fragileDueTotal - sitting.filter(isFragile).length);
}

// ---------------------------------------------------------------------------
// Text helpers for the cards

/** Blank the missed words of a phrase, keeping punctuation and the other words. */
export function blankWords(target: string, missed: readonly string[]): string {
  const want = new Set(missed.map((w) => normalizeForCompare(w)));
  if (want.size === 0) return target;
  return target.replace(/[\p{L}\p{N}]+/gu, (w) =>
    want.has(normalizeForCompare(w)) ? '_'.repeat(Math.min(Math.max(w.length, 3), 8)) : w,
  );
}

/** The meanings a gloss offers: "hello / hi" and "yes, sure" are two keys each. */
export function meaningKeys(en: string): string[] {
  return en
    .replace(/\([^)]*\)/g, ' ')
    .split(/[\/;,]/)
    .map((part) =>
      normalizeForCompare(part)
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^(to|the|a|an) /, ''),
    )
    .filter(Boolean);
}

const BARE_PRONOUN = /^(i|you|he|she|it|we|they)$/;

/**
 * Meaning keys for deciding two glosses are the SAME meaning: bracketed
 * qualifiers are kept (as part of their key), because "is (right now / state)"
 * is not "is". A bare pronoun beside other keys ("he / she lives") is a
 * distributed subject, not a synonym, so such a gloss stays one key.
 */
function alternateKeys(en: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of en) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === '/' || ch === ';' || ch === ',')) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  const norm = (t: string) =>
    normalizeForCompare(t)
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const keys = parts.map((p) => norm(p).replace(/^(to|the|a|an) /, '')).filter(Boolean);
  if (keys.length > 1 && keys.some((k) => BARE_PRONOUN.test(k))) return [norm(en)];
  return keys;
}

/**
 * Two glosses mean the same thing: equal key sets, or (only when neither has a
 * bracketed qualifier) one a subset of the other, as "bye" and "goodbye / bye".
 * Sharing one key is not enough: "he" is not "he / she lives".
 */
export function sameMeaning(a: string, b: string): boolean {
  const ka = new Set(alternateKeys(a));
  const kb = new Set(alternateKeys(b));
  if (ka.size === 0 || kb.size === 0) return false;
  const subset = (x: Set<string>, y: Set<string>) => [...x].every((k) => y.has(k));
  if (subset(ka, kb) && subset(kb, ka)) return true;
  if (a.includes('(') || b.includes('(')) return false;
  return subset(ka, kb) || subset(kb, ka);
}

interface PoolWord {
  id: string;
  text: string;
  meaning_en: string;
}

/** Other learned words that mean the same thing, as accepted answers. */
export function alternateTexts(word: PoolWord, pool: readonly PoolWord[]): string[] {
  const own = normalizeForCompare(word.text);
  const seen = new Set<string>([own]);
  const out: string[] = [];
  for (const other of pool) {
    if (other.id === word.id || !sameMeaning(word.meaning_en, other.meaning_en)) continue;
    const key = normalizeForCompare(other.text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(other.text);
  }
  return out;
}

/** A small deterministic random source, so a card's options are stable across re-renders. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The correct meaning and three others, shuffled; null when the pool cannot
 * supply three that are genuinely different (a synonym would be a trick).
 */
export function buildListenOptions(
  correct: string,
  pool: readonly string[],
  rand: () => number,
  distractors = 3,
): string[] | null {
  const chosen: string[] = [];
  const taken = new Set<string>(meaningKeys(correct));
  for (const candidate of shuffle(pool, rand)) {
    const keys = meaningKeys(candidate);
    if (keys.length === 0 || keys.some((k) => taken.has(k))) continue;
    keys.forEach((k) => taken.add(k));
    chosen.push(candidate);
    if (chosen.length === distractors) break;
  }
  if (chosen.length < distractors) return null;
  return shuffle([correct, ...chosen], rand);
}

/** A stable 32-bit seed from a string, for mulberry32. */
export function hashSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Grading an attempt (typed or spoken)

/** Closeness (0-1) at which a wrong spoken answer is prompted straight into a retry. */
export const CLOSE_SIMILARITY = 0.5;

export interface JudgeInput {
  kind: ItemKind;
  /** The item's own text: what the learner was taught. */
  own: string;
  /** Other accepted answers (learned words with the same meaning, informal form). */
  alternates: readonly string[];
  /** Best-first alternatives from the recogniser, or the one typed answer. */
  attempts: readonly string[];
  spoken: boolean;
  /** Names that are shown in a phrase but never required (the learner's own). */
  names?: readonly string[];
  /** Normalised gender flips that are a different learned word ("caso" for "casa"). */
  noVariants?: readonly string[];
}

export interface Judgement {
  verdict: 'correct' | 'partial' | 'wrong';
  /** Content words not heard (phrases; the whole word for a word). */
  missed: string[];
  /** What the learner said or typed, best attempt. */
  heard: string;
  /** Right, but through an accepted alternative or the other gender ending. */
  usedAlternative: boolean;
  /** 0-1 closeness of the best attempt to the item's own text. */
  closeness: number;
}

/**
 * Grade one attempt. Words are all-or-nothing with typo tolerance (and short
 * words allow one edit when spoken, since a recogniser hears "sim" as "sem");
 * phrases score on content words. A phrase with only two content words is not
 * given a partial: half of two is a guess, not a recall.
 */
export function judgeAttempt(input: JudgeInput): Judgement {
  const targets = [input.own, ...input.alternates.filter((a) => a.trim().length > 0)];
  const score = scoreRecall(targets, [...input.attempts], {
    kind: input.kind,
    contentWords: input.kind === 'phrase',
    names: input.names ? [...input.names] : [],
    spoken: input.spoken,
    noVariants: input.noVariants ? [...input.noVariants] : [],
  });
  const ownNorm = normalizeSentence(input.own);
  const usedAlternative =
    score.verdict === 'correct' &&
    (score.variant === 'gender' || normalizeSentence(score.bestTarget) !== ownNorm);
  const closeness = input.attempts.reduce((best, a) => Math.max(best, similarity(a, input.own)), 0);
  return {
    verdict: score.verdict,
    missed: score.verdict === 'correct' ? [] : score.missed,
    heard: score.heard,
    usedAlternative,
    closeness,
  };
}

/** A wrong spoken answer that is nearly right: the retry is prompted, not offered. */
export function isCloseMiss(judgement: Judgement): boolean {
  return judgement.verdict === 'wrong' && judgement.closeness >= CLOSE_SIMILARITY;
}

export type CardResult = Outcome | { how: 'partial'; missed: string[] };

/**
 * What the card reports becomes what the session hears. A partial phrase
 * starts the ladder on its first look and counts as hard on a re-ask; inside
 * the ladder (gap drill, whole phrase) it is not right, so it is forgot.
 */
export function toPresentationResult(stage: Stage, result: CardResult): PresentationResult {
  if (result.how === 'partial') {
    if (stage === 'gap' || stage === 'whole') return { type: 'rated', rating: 'forgot' };
    return { type: 'partial', missed: result.missed };
  }
  return { type: 'rated', rating: ratingFor(result) };
}

// ---------------------------------------------------------------------------
// The spoken-override history, persisted (localStorage) by the client

export const SPOKEN_HISTORY_KEY = 'wz.review.spoken.v1';

type StorageRead = Pick<Storage, 'getItem'>;
type StorageWrite = Pick<Storage, 'setItem'>;

/** Never throws: a private window or blocked storage is an empty history. */
export function readSpokenHistory(storage: StorageRead | null | undefined): boolean[] {
  try {
    const raw = storage?.getItem(SPOKEN_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is boolean => typeof v === 'boolean').slice(-OVERRIDE_WINDOW);
  } catch {
    return [];
  }
}

export function writeSpokenHistory(storage: StorageWrite | null | undefined, history: readonly boolean[]): void {
  try {
    storage?.setItem(SPOKEN_HISTORY_KEY, JSON.stringify(history.slice(-OVERRIDE_WINDOW)));
  } catch {
    // private window / quota: the default just resets next time
  }
}
