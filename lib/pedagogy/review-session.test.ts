import { describe, expect, it } from 'vitest';
import {
  MAX_PRESENTATIONS,
  REASK_DELAY_MS,
  alternateTexts,
  blankWords,
  buildInitialQueue,
  buildListenOptions,
  chooseMode,
  hashSeed,
  isCloseMiss,
  judgeAttempt,
  readSpokenHistory,
  SPOKEN_HISTORY_KEY,
  toPresentationResult,
  writeSpokenHistory,
  completePresentation,
  completeTeach,
  createSession,
  interleave,
  isFinished,
  isStaleLearning,
  itemKey,
  meaningKeys,
  mulberry32,
  parkRemaining,
  progressOf,
  pushSpoken,
  ratingFor,
  sameMeaning,
  settlePost,
  startNext,
  summarize,
  fragileRemaining,
  tooManyOverrides,
  type ItemKind,
  type QueueEntry,
  type Rating,
  type SessionState,
  type SittingItem,
} from './review-session';

const NOW = Date.UTC(2026, 8, 30, 12, 0, 0);
const DAY = 86_400_000;

function item(kind: ItemKind, id: string, over: Partial<SittingItem> = {}): SittingItem {
  return {
    key: itemKey(kind, id),
    kind,
    id,
    learningStep: 2,
    intervalDays: 5,
    lastReviewedAt: new Date(NOW - 3 * DAY).toISOString(),
    timesReviewed: 4,
    ...over,
  };
}

const words = (n: number, over: Partial<SittingItem> = {}) =>
  Array.from({ length: n }, (_, i) => item('word', `w${i + 1}`, over));

function keysOf(state: SessionState): string[] {
  return [...(state.current ? [state.current.key] : []), ...state.queue.map((e) => e.key)];
}

/** Answer the card on the table and (like the client) settle the POST straight away. */
function answer(
  state: SessionState,
  rating: Rating,
  opts: { known?: boolean; ok?: boolean; now?: number } = {},
): { state: SessionState; post: ReturnType<typeof completePresentation>['post'] } {
  const now = opts.now ?? NOW;
  const key = state.current!.key;
  const r = completePresentation(state, { type: 'rated', rating }, now);
  let next = r.state;
  if (r.post) {
    next = settlePost(
      next,
      key,
      r.post.rating,
      { ok: opts.ok ?? true, known: opts.known ?? (r.post.rating === 'got_it') },
      now,
    );
  }
  return { state: next, post: r.post };
}

const STEP = 10_000;

/** Answer other cards got_it (10 s each) until `key` is on the table; waits out re-ask delays. */
function driveTo(
  state: SessionState,
  key: string,
  stage: QueueEntry['stage'] | null,
  t: number,
): { state: SessionState; t: number } {
  let s = state;
  for (let guard = 0; guard < 200; guard++) {
    if (s.current && s.current.key === key && (stage === null || s.current.stage === stage)) return { state: s, t };
    if (!s.current) {
      if (s.waitUntil == null) throw new Error(`${key} never came up`);
      t = Math.max(t, s.waitUntil);
      s = startNext(s, t);
      continue;
    }
    t += STEP;
    s = answer(s, 'got_it', { known: true, now: t }).state;
  }
  throw new Error('driveTo did not converge');
}

describe('ratingFor', () => {
  it('first-try right is got_it, second-try right is hard', () => {
    expect(ratingFor({ how: 'right', tries: 1 })).toBe('got_it');
    expect(ratingFor({ how: 'right', tries: 2 })).toBe('hard');
  });
  it('"I said it right" and a correct listen are hard', () => {
    expect(ratingFor({ how: 'override' })).toBe('hard');
    expect(ratingFor({ how: 'listen', correct: true })).toBe('hard');
  });
  it('wrong, a wrong listen and "I don\'t know" are forgot', () => {
    expect(ratingFor({ how: 'wrong' })).toBe('forgot');
    expect(ratingFor({ how: 'listen', correct: false })).toBe('forgot');
    expect(ratingFor({ how: 'idk' })).toBe('forgot');
  });
});

describe('spoken override tracker', () => {
  it('keeps the last ten', () => {
    let h: boolean[] = [];
    for (let i = 0; i < 14; i++) h = pushSpoken(h, i === 0);
    expect(h).toHaveLength(10);
    expect(h.some(Boolean)).toBe(false);
  });
  it('three overrides in the last ten tips to typing; two do not', () => {
    expect(tooManyOverrides([true, true, false, false])).toBe(false);
    expect(tooManyOverrides([true, true, false, true])).toBe(true);
  });
  it('an old override falls out of the window', () => {
    let h = [true, true, true];
    for (let i = 0; i < 10; i++) h = pushSpoken(h, false);
    expect(tooManyOverrides(h)).toBe(false);
  });
});

describe('chooseMode', () => {
  const entry = (stage: QueueEntry['stage']): QueueEntry => ({ id: 1, key: 'word:w1', stage, notBefore: 0 });
  const ctx = { speechAvailable: true, recentSpoken: [] as boolean[], canListen: true };

  it('says when speech works, types when it does not', () => {
    expect(chooseMode(entry('first'), item('word', 'w1', { timesReviewed: 0 }), ctx)).toBe('say');
    expect(chooseMode(entry('first'), item('word', 'w1', { timesReviewed: 0 }), { ...ctx, speechAvailable: false })).toBe('type');
  });

  it('types when the learner overrode 3 of the last 10 spoken answers', () => {
    expect(
      chooseMode(entry('first'), item('word', 'w1', { timesReviewed: 0 }), { ...ctx, recentSpoken: [true, false, true, true] }),
    ).toBe('type');
  });

  it('listens for a graduated item on times_reviewed % 3 === 2', () => {
    expect(chooseMode(entry('first'), item('word', 'w1', { timesReviewed: 2 }), ctx)).toBe('listen');
    expect(chooseMode(entry('first'), item('word', 'w1', { timesReviewed: 5 }), ctx)).toBe('listen');
    expect(chooseMode(entry('first'), item('word', 'w1', { timesReviewed: 3 }), ctx)).toBe('say');
  });

  it('never listens for a learning item, a re-ask, or when options cannot be built', () => {
    expect(chooseMode(entry('first'), item('word', 'w1', { timesReviewed: 2, learningStep: 0 }), ctx)).toBe('say');
    expect(chooseMode(entry('reask'), item('word', 'w1', { timesReviewed: 2 }), ctx)).toBe('say');
    expect(chooseMode(entry('gap'), item('word', 'w1', { timesReviewed: 2 }), ctx)).toBe('say');
    expect(chooseMode(entry('first'), item('word', 'w1', { timesReviewed: 2 }), { ...ctx, canListen: false })).toBe('say');
  });

  it('a teach entry is a teach card', () => {
    expect(chooseMode(entry('teach'), item('word', 'w1'), ctx)).toBe('teach');
  });
});

describe('initial queue', () => {
  it('interleaves two words to a phrase and keeps the server order inside each list', () => {
    const w = words(5);
    const p = [item('phrase', 'p1'), item('phrase', 'p2')];
    expect(interleave(w, p).map((i) => i.key)).toEqual([
      'word:w1', 'word:w2', 'phrase:p1', 'word:w3', 'word:w4', 'phrase:p2', 'word:w5',
    ]);
  });

  it('keeps plain server order with no teach cards', () => {
    const q = buildInitialQueue(words(4), { now: NOW, teach: true });
    expect(q.map((e) => e.key)).toEqual(['word:w1', 'word:w2', 'word:w3', 'word:w4']);
    expect(q.every((e) => e.stage === 'first')).toBe(true);
  });

  it('only a learning item unseen for over 14 days is stale', () => {
    const old = new Date(NOW - 15 * DAY).toISOString();
    expect(isStaleLearning(item('word', 'a', { learningStep: 0, lastReviewedAt: old }), NOW)).toBe(true);
    expect(isStaleLearning(item('word', 'a', { learningStep: 1, lastReviewedAt: old }), NOW)).toBe(true);
    expect(isStaleLearning(item('word', 'a', { learningStep: 2, lastReviewedAt: old }), NOW)).toBe(false);
    expect(isStaleLearning(item('word', 'a', { learningStep: 0, lastReviewedAt: new Date(NOW - 13 * DAY) }), NOW)).toBe(false);
    expect(isStaleLearning(item('word', 'a', { learningStep: 0, lastReviewedAt: null }), NOW)).toBe(false);
  });

  it('a stale item opens with a teach card and its recall comes at least 3 cards later', () => {
    const stale = item('word', 'stale', { learningStep: 0, lastReviewedAt: new Date(NOW - 30 * DAY).toISOString() });
    const q = buildInitialQueue([words(1)[0], stale, ...words(6).slice(1).map((w) => ({ ...w, id: 'x' + w.id, key: 'word:x' + w.id }))], {
      now: NOW,
      teach: true,
    });
    const teachAt = q.findIndex((e) => e.stage === 'teach');
    const recallAt = q.findIndex((e) => e.key === stale.key && e.stage === 'first');
    expect(q[teachAt].key).toBe(stale.key);
    expect(recallAt - teachAt).toBeGreaterThanOrEqual(4);
    expect(q).toHaveLength(8);
  });

  it('a stale item near the end still gets its recall, after the rest', () => {
    const stale = item('word', 'stale', { learningStep: 0, lastReviewedAt: new Date(NOW - 30 * DAY).toISOString() });
    const q = buildInitialQueue([...words(2), stale], { now: NOW, teach: true });
    expect(q.map((e) => `${e.key}:${e.stage}`)).toEqual([
      'word:w1:first', 'word:w2:first', 'word:stale:teach', 'word:stale:first',
    ]);
  });

  it('two stale items keep their own spacing', () => {
    const old = new Date(NOW - 30 * DAY).toISOString();
    const a = item('word', 'a', { learningStep: 0, lastReviewedAt: old });
    const b = item('word', 'b', { learningStep: 0, lastReviewedAt: old });
    const q = buildInitialQueue([a, b, ...words(6)], { now: NOW, teach: true });
    for (const k of ['word:a', 'word:b']) {
      const t = q.findIndex((e) => e.key === k && e.stage === 'teach');
      const r = q.findIndex((e) => e.key === k && e.stage === 'first');
      expect(r - t).toBeGreaterThanOrEqual(3);
    }
    expect(q).toHaveLength(10);
  });

  it('practice sittings never teach', () => {
    const stale = item('word', 'stale', { learningStep: 0, lastReviewedAt: new Date(NOW - 30 * DAY).toISOString() });
    const s = createSession({ items: [stale, ...words(3)], source: 'practice', now: NOW });
    expect(keysOf(s)).toHaveLength(4);
    expect([s.current, ...s.queue].every((e) => e!.stage === 'first')).toBe(true);
  });

  it('createSession puts the first card on the table and counts the first pass', () => {
    const s = createSession({ items: words(3), source: 'review', now: NOW });
    expect(s.current?.key).toBe('word:w1');
    expect(s.queue).toHaveLength(2);
    expect(progressOf(s)).toEqual({ done: 0, total: 3, comingBack: 0 });
  });

  it('a teach card is not graded and does not count as first-pass done', () => {
    const stale = item('word', 'stale', { learningStep: 0, lastReviewedAt: new Date(NOW - 30 * DAY).toISOString() });
    let s = createSession({ items: [stale, ...words(4)], source: 'review', now: NOW });
    expect(s.current?.stage).toBe('teach');
    const r = completePresentation(s, { type: 'rated', rating: 'got_it' }, NOW);
    expect(r.post).toBeNull();
    s = completeTeach(s, NOW);
    expect(progressOf(s).done).toBe(0);
    expect(s.current?.key).toBe('word:w1');
  });
});

describe('first pass', () => {
  it('a got_it that the engine confirms leaves the item done', () => {
    let s = createSession({ items: words(3), source: 'review', now: NOW });
    const r = answer(s, 'got_it', { known: true });
    s = r.state;
    expect(r.post).toMatchObject({ key: 'word:w1', rating: 'got_it', presentation: 1 });
    expect(s.current?.key).toBe('word:w2');
    expect(keysOf(s)).toEqual(['word:w2', 'word:w3']);
    expect(progressOf(s)).toEqual({ done: 1, total: 3, comingBack: 0 });
    expect(s.progress['word:w1'].known).toBe(true);
  });

  it('a got_it the engine did not accept (still learning) comes back', () => {
    let s = createSession({ items: words(8), source: 'review', now: NOW });
    s = answer(s, 'got_it', { known: false }).state;
    expect(s.queue.some((e) => e.key === 'word:w1' && e.stage === 'reask')).toBe(true);
  });

  it('progress counts first-pass items cleared and re-asks pending separately', () => {
    let s = createSession({ items: words(8), source: 'review', now: NOW });
    s = answer(s, 'forgot', { known: false }).state;
    expect(progressOf(s)).toEqual({ done: 1, total: 8, comingBack: 1 });
    s = answer(s, 'got_it', { known: true }).state;
    expect(progressOf(s)).toEqual({ done: 2, total: 8, comingBack: 1 });
  });
});

describe('re-queue rules', () => {
  it('a miss comes back 5 cards later, not sooner than 20 s', () => {
    let s = createSession({ items: words(10), source: 'review', now: NOW });
    s = answer(s, 'forgot', { known: false }).state;
    const idx = s.queue.findIndex((e) => e.key === 'word:w1');
    // w2 is on the table and w3..w6 come before w1: five cards first
    expect(s.current?.key).toBe('word:w2');
    expect(s.queue.slice(0, idx).map((e) => e.key)).toEqual(['word:w3', 'word:w4', 'word:w5', 'word:w6']);
    expect(s.queue[idx]).toMatchObject({ stage: 'reask', notBefore: NOW + REASK_DELAY_MS });
  });

  it('near the end it goes as far back as the queue allows (at least 3 when 3+ remain)', () => {
    let s = createSession({ items: words(5), source: 'review', now: NOW });
    s = answer(s, 'forgot', { known: false }).state;
    // remaining after w1: w2 (current), w3, w4, w5 -> queue has 3, re-ask goes to the end
    expect(s.queue.map((e) => e.key)).toEqual(['word:w3', 'word:w4', 'word:w5', 'word:w1']);
  });

  it('a re-ask that is not due yet is skipped for one that is', () => {
    let s = createSession({ items: words(7), source: 'review', now: NOW });
    s = answer(s, 'forgot', { known: false }).state;
    // Answer the rest quickly: w1 is not ready until NOW + 20s.
    for (let i = 0; i < 5; i++) s = answer(s, 'got_it', { known: true, now: NOW + 1000 * (i + 1) }).state;
    // Only w1 (not due) and maybe one more remain
    const s2 = startNext({ ...s, current: null }, NOW + 6000);
    expect(s2.current === null || s2.current.key !== 'word:w1' || s2.current.notBefore <= NOW + 6000).toBe(true);
  });

  it('when only a not-yet-due re-ask is left it waits, then shows it', () => {
    let s = createSession({ items: words(3), source: 'review', now: NOW });
    s = answer(s, 'forgot', { known: false }).state; // w1 re-asked; w2 current, w3 queue, w1 at end
    s = answer(s, 'got_it', { known: true, now: NOW + 1000 }).state; // w2
    s = answer(s, 'got_it', { known: true, now: NOW + 2000 }).state; // w3
    expect(s.current).toBeNull();
    expect(s.waitUntil).toBe(NOW + REASK_DELAY_MS);
    expect(isFinished(s)).toBe(false);
    const later = startNext(s, NOW + REASK_DELAY_MS);
    expect(later.current?.key).toBe('word:w1');
    expect(later.waitUntil).toBeNull();
  });

  it('parks after three presentations and never re-queues a fourth', () => {
    let s = createSession({ items: words(12), source: 'review', now: NOW });
    let t = NOW;
    s = answer(s, 'forgot', { known: false, now: t }).state;
    for (let round = 0; round < 2; round++) {
      ({ state: s, t } = driveTo(s, 'word:w1', 'reask', t));
      s = answer(s, 'forgot', { known: false, now: t }).state;
    }
    expect(s.progress['word:w1'].presentations).toBe(MAX_PRESENTATIONS);
    expect(s.progress['word:w1'].parked).toBe(true);
    expect(keysOf(s).includes('word:w1')).toBe(false);
  });

  it('stops when the queue would contain only that item', () => {
    let s = createSession({ items: words(1), source: 'review', now: NOW });
    s = answer(s, 'forgot', { known: false }).state;
    expect(isFinished(s)).toBe(true);
    expect(s.progress['word:w1'].parked).toBe(true);
    expect(summarize(s, { dueRemaining: 0, sittingSize: 20 })).toMatchObject({ lockedIn: 0, parked: 1, stillWaiting: 1 });
  });

  it('a hard on a learning item is re-asked; a hard that graduates is not', () => {
    let a = createSession({ items: words(8, { learningStep: 0 }), source: 'review', now: NOW });
    a = answer(a, 'hard', { known: false }).state;
    expect(a.queue.some((e) => e.key === 'word:w1')).toBe(true);
    let b = createSession({ items: words(8), source: 'review', now: NOW });
    b = answer(b, 'hard', { known: true }).state;
    expect(b.queue.some((e) => e.key === 'word:w1')).toBe(false);
  });

  it('a failed POST re-queues by the rating: got_it done, anything else comes back', () => {
    let a = createSession({ items: words(8), source: 'review', now: NOW });
    a = answer(a, 'got_it', { ok: false }).state;
    expect(a.queue.some((e) => e.key === 'word:w1')).toBe(false);
    let b = createSession({ items: words(8), source: 'review', now: NOW });
    b = answer(b, 'hard', { ok: false }).state;
    expect(b.queue.some((e) => e.key === 'word:w1')).toBe(true);
    let c = createSession({ items: words(8), source: 'review', now: NOW });
    c = answer(c, 'forgot', { ok: false }).state;
    expect(c.queue.some((e) => e.key === 'word:w1')).toBe(true);
  });

  it('numbers each POST for an item so the server can tell the first from the rest', () => {
    let t = NOW;
    let s = createSession({ items: words(8), source: 'review', now: t });
    const first = answer(s, 'forgot', { known: false, now: t });
    expect(first.post?.presentation).toBe(1);
    ({ state: s, t } = driveTo(first.state, 'word:w1', 'reask', t));
    const second = answer(s, 'got_it', { known: true, now: t });
    expect(second.post?.presentation).toBe(2);
  });
});

describe('practice mode', () => {
  it('re-queues a miss once, then leaves it', () => {
    let s = createSession({ items: words(10), source: 'practice', now: NOW });
    let t = NOW;
    s = answer(s, 'forgot', { now: t }).state;
    expect(s.queue.filter((e) => e.key === 'word:w1')).toHaveLength(1);
    ({ state: s, t } = driveTo(s, 'word:w1', 'reask', t));
    s = answer(s, 'forgot', { now: t }).state;
    expect(keysOf(s).includes('word:w1')).toBe(false);
    expect(s.progress['word:w1'].parked).toBe(false);
  });

  it('a practice miss is not a debt in the summary', () => {
    let s = createSession({ items: words(2), source: 'practice', now: NOW });
    s = answer(s, 'forgot').state;
    const sum = summarize(s, { dueRemaining: 0, sittingSize: 20 });
    expect(sum.parked).toBe(0);
    expect(sum.stillWaiting).toBe(0);
  });
});

describe('phrase ladder', () => {
  const phrase = (over: Partial<SittingItem> = {}) => item('phrase', 'p1', over);
  const start = (n = 10) => createSession({ items: [phrase(), ...words(n)], source: 'review', now: NOW });

  it('a partial defers the POST and schedules the gap drill 3 cards later', () => {
    const s = start();
    const r = completePresentation(s, { type: 'partial', missed: ['muito'] }, NOW);
    expect(r.post).toBeNull();
    // w1 is on the table; w2 and w3 come before the drill: three cards first
    expect(r.state.current?.key).toBe('word:w1');
    const idx = r.state.queue.findIndex((e) => e.key === 'phrase:p1');
    expect(r.state.queue[idx]).toMatchObject({ stage: 'gap', notBefore: NOW + REASK_DELAY_MS });
    expect(idx).toBe(2);
    expect(r.state.progress['phrase:p1'].ladder).toEqual({ missed: ['muito'], gapRight: null });
    expect(progressOf(r.state)).toMatchObject({ done: 1, comingBack: 1 });
  });

  it('gap drill, then the whole phrase 6 cards later; one POST at the end, right is hard', () => {
    let t = NOW;
    let s = completePresentation(start(), { type: 'partial', missed: ['muito'] }, t).state;
    ({ state: s, t } = driveTo(s, 'phrase:p1', 'gap', t));
    const gap = completePresentation(s, { type: 'rated', rating: 'got_it' }, t);
    expect(gap.post).toBeNull();
    const wholeAt = gap.state.queue.findIndex((e) => e.key === 'phrase:p1');
    expect(gap.state.queue[wholeAt]).toMatchObject({ stage: 'whole' });
    // the card on the table plus the ones queued before it: six cards come first
    expect((gap.state.current ? 1 : 0) + wholeAt).toBe(6);
    s = gap.state;
    ({ state: s, t } = driveTo(s, 'phrase:p1', 'whole', t));
    const end = completePresentation(s, { type: 'rated', rating: 'got_it' }, t);
    expect(end.post).toMatchObject({ key: 'phrase:p1', rating: 'hard', presentation: 1 });
    expect(end.state.progress['phrase:p1'].presentations).toBe(3);
  });

  it('a wrong whole phrase at the end is forgot, and the item is parked (3 presentations used)', () => {
    let t = NOW;
    let s = completePresentation(start(9), { type: 'partial', missed: ['muito'] }, t).state;
    ({ state: s, t } = driveTo(s, 'phrase:p1', 'gap', t));
    s = completePresentation(s, { type: 'rated', rating: 'forgot' }, t).state;
    ({ state: s, t } = driveTo(s, 'phrase:p1', 'whole', t));
    const r = answer(s, 'forgot', { known: false, now: t });
    expect(r.post).toMatchObject({ rating: 'forgot' });
    expect(r.state.progress['phrase:p1'].parked).toBe(true);
    expect(keysOf(r.state).includes('phrase:p1')).toBe(false);
  });

  it('a whole phrase said right on a retry is hard too; an override counts as right', () => {
    let t = NOW;
    let s = completePresentation(start(9), { type: 'partial', missed: ['muito'] }, t).state;
    ({ state: s, t } = driveTo(s, 'phrase:p1', 'gap', t));
    s = completePresentation(s, { type: 'rated', rating: 'hard' }, t).state;
    ({ state: s, t } = driveTo(s, 'phrase:p1', 'whole', t));
    expect(completePresentation(s, { type: 'rated', rating: 'hard' }, t).post?.rating).toBe('hard');
  });

  it('with nothing left to space it against, a partial is posted as hard at once', () => {
    const s = createSession({ items: [phrase()], source: 'review', now: NOW });
    const r = completePresentation(s, { type: 'partial', missed: ['muito'] }, NOW);
    expect(r.post).toMatchObject({ key: 'phrase:p1', rating: 'hard', presentation: 1 });
    expect(r.state.queue).toHaveLength(0);
  });

  it('when the gap drill is answered with nothing left, the ladder ends on that answer', () => {
    let t = NOW;
    let s = createSession({ items: [phrase(), ...words(2)], source: 'review', now: t });
    s = completePresentation(s, { type: 'partial', missed: ['muito'] }, t).state;
    ({ state: s, t } = driveTo(s, 'phrase:p1', 'gap', t));
    expect(s.queue).toHaveLength(0);
    expect(completePresentation(s, { type: 'rated', rating: 'forgot' }, t).post?.rating).toBe('forgot');
    expect(completePresentation(s, { type: 'rated', rating: 'got_it' }, t).post?.rating).toBe('hard');
  });

  it('a partial on a re-ask (not the first look) is just hard, no second ladder', () => {
    let t = NOW;
    let s = start(10);
    s = answer(s, 'forgot', { known: false, now: t }).state; // phrase forgot on first look
    ({ state: s, t } = driveTo(s, 'phrase:p1', 'reask', t));
    const r = completePresentation(s, { type: 'partial', missed: ['x'] }, t);
    expect(r.post).toMatchObject({ rating: 'hard', presentation: 2 });
  });

  it('a word never starts a ladder', () => {
    const s = createSession({ items: words(6), source: 'review', now: NOW });
    const r = completePresentation(s, { type: 'partial', missed: ['x'] }, NOW);
    expect(r.post).toMatchObject({ rating: 'hard' });
  });
});

describe('parkRemaining', () => {
  it('clears the queue, parks what is unknown, and posts an unfinished ladder', () => {
    let s = createSession({ items: [item('phrase', 'p1'), ...words(6)], source: 'review', now: NOW });
    s = completePresentation(s, { type: 'partial', missed: ['x'] }, NOW).state;
    s = answer(s, 'forgot', { known: false }).state; // w1 forgot -> re-ask queued
    const r = parkRemaining(s);
    expect(r.state.queue).toHaveLength(0);
    expect(r.state.current).toBeNull();
    expect(r.posts).toEqual([expect.objectContaining({ key: 'phrase:p1', rating: 'hard', presentation: 1 })]);
    expect(r.state.progress['word:w1'].parked).toBe(true);
    // items never asked are owed too
    expect(summarize(r.state, { dueRemaining: 0, sittingSize: 20 }).parked).toBeGreaterThanOrEqual(6);
  });
});

describe('summary', () => {
  it('counts locked in vs parked and turns the rest into sittings', () => {
    let s = createSession({ items: words(3), source: 'review', now: NOW });
    s = answer(s, 'got_it', { known: true }).state;
    s = answer(s, 'got_it', { known: true }).state;
    s = answer(s, 'forgot', { known: false }).state; // last card: parked (nothing to space it against)
    const sum = summarize(s, { dueRemaining: 38, sittingSize: 20 });
    expect(sum).toMatchObject({ total: 3, lockedIn: 2, parked: 1, stillWaiting: 39, sittings: 2, canMoveOn: false });
  });

  it('offers to move on only when nothing fragile is left', () => {
    let s = createSession({ items: words(2), source: 'review', now: NOW });
    s = answer(s, 'got_it', { known: true }).state;
    s = answer(s, 'got_it', { known: true }).state;
    expect(summarize(s, { dueRemaining: 0, sittingSize: 20 })).toMatchObject({ parked: 0, sittings: 0, canMoveOn: true });
    expect(summarize(s, { dueRemaining: 8, sittingSize: 20 }).canMoveOn).toBe(true);
    expect(summarize(s, { dueRemaining: 9, sittingSize: 20 }).canMoveOn).toBe(false);
  });
});

describe('summary: moving on follows the fragile items, not everything due', () => {
  const item = (id: string, learningStep: number, intervalDays: number) => ({
    key: `word:${id}`,
    kind: 'word' as const,
    id,
    learningStep,
    intervalDays,
    lastReviewedAt: null,
    timesReviewed: 3,
  });

  it('30 mature items due and no fragile ones still lets the learner move on', () => {
    let s = createSession({ items: words(2), source: 'review', now: NOW });
    s = answer(s, 'got_it', { known: true }).state;
    s = answer(s, 'got_it', { known: true }).state;
    const sum = summarize(s, { dueRemaining: 10, sittingSize: 20, fragileRemaining: 0 });
    expect(sum.stillWaiting).toBe(10);
    expect(sum.canMoveOn).toBe(true);
  });

  it('fragile items left over hold "Next scene" back at the gate threshold', () => {
    let s = createSession({ items: words(2), source: 'review', now: NOW });
    s = answer(s, 'got_it', { known: true }).state;
    s = answer(s, 'got_it', { known: true }).state;
    expect(summarize(s, { dueRemaining: 9, sittingSize: 20, fragileRemaining: 8 }).canMoveOn).toBe(true);
    expect(summarize(s, { dueRemaining: 9, sittingSize: 20, fragileRemaining: 9 }).canMoveOn).toBe(false);
  });

  it('fragileRemaining subtracts only the sitting items that were fragile at load', () => {
    const sitting = [item('a', 0, 0), item('b', 2, 3), item('c', 3, 30), item('d', 4, 12)];
    // a (learning) and b (interval <= 3) were fragile; c and d were mature catch-up
    expect(fragileRemaining(10, sitting)).toBe(8);
    expect(fragileRemaining(1, sitting)).toBe(0);
  });
});

describe('text helpers', () => {
  it('blankWords blanks whole missed words, accent-insensitively, and keeps punctuation', () => {
    expect(blankWords('Eu gosto muito de café!', ['muito', 'cafe'])).toBe('Eu gosto _____ de ____!');
    expect(blankWords('Eu gosto', [])).toBe('Eu gosto');
    expect(blankWords('Eu vou', ['não'])).toBe('Eu vou');
  });

  it('meaning keys ignore articles, "to", brackets and split on / ; ,', () => {
    expect(meaningKeys('to eat')).toEqual(['eat']);
    expect(meaningKeys('hello / hi (informal)')).toEqual(['hello', 'hi']);
    expect(meaningKeys('the house')).toEqual(['house']);
    expect(sameMeaning('goodbye / bye', 'bye')).toBe(true);
    expect(sameMeaning('to eat', 'to drink')).toBe(false);
  });

  it('same meaning needs the same gloss, not one shared word', () => {
    expect(sameMeaning('is (right now / state)', 'is / he-she-it is')).toBe(false); // está vs é
    expect(sameMeaning('he / she lives', 'he')).toBe(false); // mora vs ele
    expect(sameMeaning('he / she speaks', 'he')).toBe(false); // fala vs ele
    expect(sameMeaning('is located / is (stays)', 'is (right now / state)')).toBe(false); // fica vs está
    expect(sameMeaning('return (round trip)', 'return')).toBe(false);
    expect(sameMeaning('he / she lives', 'he / she lives')).toBe(true);
    expect(sameMeaning('is (right now / state)', 'is (right now / state)')).toBe(true);
    expect(sameMeaning('goodbye / bye', 'bye')).toBe(true);
    expect(sameMeaning('bye', 'goodbye / bye')).toBe(true);
  });

  it('alternates leave different words with an overlapping gloss out', () => {
    const pool = [
      { id: 'a', text: 'está', meaning_en: 'is (right now / state)' },
      { id: 'b', text: 'é', meaning_en: 'is / he-she-it is' },
      { id: 'c', text: 'ele', meaning_en: 'he' },
      { id: 'd', text: 'mora', meaning_en: 'he / she lives' },
      { id: 'e', text: 'fala', meaning_en: 'he / she speaks' },
    ];
    for (const w of pool) expect(alternateTexts(w, pool)).toEqual([]);
  });

  it('alternates are other learned words with the same meaning, not the word itself', () => {
    const word = { id: '1', text: 'tchau', meaning_en: 'bye' };
    const pool = [
      word,
      { id: '2', text: 'adeus', meaning_en: 'goodbye / bye' },
      { id: '3', text: 'tchau', meaning_en: 'bye' },
      { id: '4', text: 'olá', meaning_en: 'hello' },
      { id: '5', text: 'Adeus', meaning_en: 'bye' },
    ];
    expect(alternateTexts(word, pool)).toEqual(['adeus']);
  });

  it('listen options: the answer plus three different meanings, none a synonym', () => {
    const pool = ['hello', 'water', 'bread', 'to eat (food)', 'eat', 'coffee'];
    const opts = buildListenOptions('to eat', pool, mulberry32(7))!;
    expect(opts).toHaveLength(4);
    expect(opts).toContain('to eat');
    expect(opts).not.toContain('eat');
    expect(opts).not.toContain('to eat (food)');
    expect(new Set(opts).size).toBe(4);
  });

  it('listen options are null when the pool cannot supply three', () => {
    expect(buildListenOptions('bye', ['hello', 'goodbye / bye'], mulberry32(1))).toBeNull();
    expect(buildListenOptions('bye', [], mulberry32(1))).toBeNull();
  });

  it('is deterministic for a seed, so a card keeps its options across renders', () => {
    const pool = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6'];
    expect(buildListenOptions('x0', pool, mulberry32(42))).toEqual(buildListenOptions('x0', pool, mulberry32(42)));
  });
});

describe('judgeAttempt', () => {
  const base = { alternates: [] as string[], spoken: false };

  it('a word is right, accents and case ignored, and wrong otherwise', () => {
    expect(judgeAttempt({ ...base, kind: 'word', own: 'você', attempts: ['Voce'] }).verdict).toBe('correct');
    const wrong = judgeAttempt({ ...base, kind: 'word', own: 'você', attempts: ['tu'] });
    expect(wrong.verdict).toBe('wrong');
    expect(wrong.usedAlternative).toBe(false);
  });

  it('an accepted alternative is right and flagged so the card can say what we were looking for', () => {
    const j = judgeAttempt({ ...base, kind: 'word', own: 'obrigado', alternates: ['valeu'], attempts: ['valeu'] });
    expect(j.verdict).toBe('correct');
    expect(j.usedAlternative).toBe(true);
    expect(judgeAttempt({ ...base, kind: 'word', own: 'obrigado', alternates: ['valeu'], attempts: ['obrigado'] }).usedAlternative).toBe(false);
  });

  it('the other gender ending counts, and is flagged, unless it is a different learned word', () => {
    const j = judgeAttempt({ ...base, kind: 'word', own: 'obrigado', attempts: ['obrigada'] });
    expect(j).toMatchObject({ verdict: 'correct', usedAlternative: true });
    const casa = judgeAttempt({ ...base, kind: 'word', own: 'casa', attempts: ['caso'], noVariants: ['caso'] });
    expect(casa.verdict).toBe('wrong');
  });

  it('a recogniser mishearing a short word is tolerated only when spoken', () => {
    expect(judgeAttempt({ ...base, kind: 'word', own: 'sim', attempts: ['sem'], spoken: true }).verdict).toBe('correct');
    expect(judgeAttempt({ ...base, kind: 'word', own: 'sim', attempts: ['sem'], spoken: false }).verdict).toBe('wrong');
  });

  it('a phrase ignores function words and the learner name; half the content words is a partial', () => {
    const own = 'Eu gosto muito do café da manhã';
    expect(judgeAttempt({ ...base, kind: 'phrase', own, attempts: ['eu gosto muito café manhã'] }).verdict).toBe('correct');
    const partial = judgeAttempt({ ...base, kind: 'phrase', own, attempts: ['eu gosto café'] });
    expect(partial.verdict).toBe('partial');
    expect(partial.missed.map((w) => w.toLowerCase())).toEqual(expect.arrayContaining(['muito', 'manhã']));
    expect(judgeAttempt({ ...base, kind: 'phrase', own, attempts: ['nada'] }).verdict).toBe('wrong');
    expect(
      judgeAttempt({ ...base, kind: 'phrase', own: 'Meu nome é Ben', attempts: ['meu nome'], names: ['Ben'] }).verdict,
    ).toBe('correct');
  });

  it('closeness prompts the retry: a near miss is close, a stranger is not', () => {
    const near = judgeAttempt({ ...base, kind: 'word', own: 'obrigado', attempts: ['obrigad'], spoken: true });
    expect(near.closeness).toBeGreaterThanOrEqual(0.5);
    expect(isCloseMiss({ ...near, verdict: 'wrong' })).toBe(true);
    const far = judgeAttempt({ ...base, kind: 'word', own: 'obrigado', attempts: ['tchau'], spoken: true });
    expect(isCloseMiss(far)).toBe(false);
    // a right answer is never a "close miss"
    expect(isCloseMiss(judgeAttempt({ ...base, kind: 'word', own: 'sim', attempts: ['sim'] }))).toBe(false);
  });
});

describe('toPresentationResult', () => {
  it('a partial starts the ladder on the first look, is hard on a re-ask, and is not right inside the ladder', () => {
    expect(toPresentationResult('first', { how: 'partial', missed: ['muito'] })).toEqual({ type: 'partial', missed: ['muito'] });
    expect(toPresentationResult('reask', { how: 'partial', missed: ['muito'] })).toEqual({ type: 'partial', missed: ['muito'] });
    expect(toPresentationResult('gap', { how: 'partial', missed: ['muito'] })).toEqual({ type: 'rated', rating: 'forgot' });
    expect(toPresentationResult('whole', { how: 'partial', missed: ['muito'] })).toEqual({ type: 'rated', rating: 'forgot' });
  });

  it('other outcomes go through ratingFor', () => {
    expect(toPresentationResult('first', { how: 'right', tries: 1 })).toEqual({ type: 'rated', rating: 'got_it' });
    expect(toPresentationResult('first', { how: 'right', tries: 2 })).toEqual({ type: 'rated', rating: 'hard' });
    expect(toPresentationResult('first', { how: 'override' })).toEqual({ type: 'rated', rating: 'hard' });
    expect(toPresentationResult('first', { how: 'listen', correct: true })).toEqual({ type: 'rated', rating: 'hard' });
    expect(toPresentationResult('reask', { how: 'idk' })).toEqual({ type: 'rated', rating: 'forgot' });
  });
});

describe('spoken history storage', () => {
  it('round-trips, keeps the newest ten, and survives bad or missing storage', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    writeSpokenHistory(storage, Array.from({ length: 14 }, (_, i) => i % 2 === 0));
    expect(readSpokenHistory(storage)).toHaveLength(10);
    mem.set(SPOKEN_HISTORY_KEY, 'not json');
    expect(readSpokenHistory(storage)).toEqual([]);
    mem.set(SPOKEN_HISTORY_KEY, JSON.stringify({ a: 1 }));
    expect(readSpokenHistory(storage)).toEqual([]);
    mem.set(SPOKEN_HISTORY_KEY, JSON.stringify([true, 3, 'x', false]));
    expect(readSpokenHistory(storage)).toEqual([true, false]);
    expect(readSpokenHistory(null)).toEqual([]);
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readSpokenHistory(throwing)).toEqual([]);
    expect(() => writeSpokenHistory(throwing, [true])).not.toThrow();
    expect(() => writeSpokenHistory(undefined, [true])).not.toThrow();
  });
});

describe('hashSeed', () => {
  it('is stable per key and differs across keys, so a card keeps its options', () => {
    expect(hashSeed('word:a')).toBe(hashSeed('word:a'));
    expect(hashSeed('word:a')).not.toBe(hashSeed('word:b'));
    const opts = () => buildListenOptions('cat', ['dog', 'bird', 'fish', 'horse'], mulberry32(hashSeed('word:a')));
    expect(opts()).toEqual(opts());
  });
});
