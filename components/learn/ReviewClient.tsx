'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { Fox } from '@/components/mascot/Fox';
import { InsightCard } from '@/components/insights/InsightCard';
import { CanDoTest } from '@/components/learn/CanDoTest';
import { ReviewComplete } from '@/components/learn/ReviewComplete';
import { ListenCard } from '@/components/learn/review/ListenCard';
import { ProductionCard, type CardCommit } from '@/components/learn/review/ProductionCard';
import { TeachCard } from '@/components/learn/review/TeachCard';
import { HeaderPortal, ProgressBarPortal } from '@/components/learn/review/portals';
import {
  phraseView,
  sittingItemOfPhrase,
  sittingItemOfWord,
  wordView,
  type ItemView,
  type PoolWord,
} from '@/components/learn/review/item-view';
import { isSpeechAnswerAvailable } from '@/components/audio/SpeakAnswer';
import { preloadAudioUrls } from '@/lib/audio/pronunciation';
import { getEligibleInsight } from '@/lib/insights/engine';
import { toastError } from '@/lib/ui/toast';
import {
  buildListenOptions,
  chooseMode,
  completePresentation,
  completeTeach,
  createSession,
  hashSeed,
  fragileRemaining,
  interleave,
  isFinished,
  mulberry32,
  parkRemaining,
  progressOf,
  pushSpoken,
  readSpokenHistory,
  settlePost,
  startNext,
  summarize,
  toPresentationResult,
  tooManyOverrides,
  writeSpokenHistory,
  type CardMode,
  type PostRequest,
  type QueueEntry,
  type SessionState,
} from '@/lib/pedagogy/review-session';
import type { InsightDefinition } from '@/lib/insights/data';
import type { DueWordForReview } from '@/lib/db/queries';
import type { DuePhraseForReview } from '@/lib/db/scene-flow-queries';
import type { DueCanDo } from '@/lib/db/can-do-queries';
import type { LearnWordFamily } from '@/types/learn';
import type { PhraseWordMnemonic } from '@/types/database';

interface ReviewClientProps {
  dueWords: DueWordForReview[];
  duePhrases: DuePhraseForReview[];
  /** Learned words for "Practice now" (not due; nothing is scheduled by it). */
  practiceWords?: DueWordForReview[];
  /** Learned words in this language: distractors for listening, and same-meaning alternates. */
  wordPool?: PoolWord[];
  wordFamiliesMap?: Record<string, LearnWordFamily[]>;
  phraseWordMap?: Record<string, PhraseWordMnemonic[]>;
  languageCode?: string | null;
  /** Words + phrases due in this language, UNCAPPED (the sitting is capped). */
  dueTotal?: number;
  /** Fragile items due (the scene gate's predicate), UNCAPPED: decides "Next scene". */
  fragileDueTotal?: number;
  /** Words + phrases in one full sitting, for "N still waiting ≈ D sittings". */
  sittingSize?: number;
  /** The learner's first name: shown in phrases but never required in an answer. */
  learnerName?: string | null;
  /** The scene the sitting was opened from ("Lock these in"). */
  sceneId?: string | null;
  insightState?: { seenIds: string[]; shownToday: number };
}

const CAN_DO_TIMEOUT_MS = 8000;

// Stable defaults, so an omitted prop does not rebuild the memoised views.
const NO_WORDS: DueWordForReview[] = [];
const NO_POOL: PoolWord[] = [];
const NO_MAP: Record<string, LearnWordFamily[]> = {};
const NO_PHRASE_MAP: Record<string, PhraseWordMnemonic[]> = {};

const subscribeNever = () => () => {};

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function ReviewClient(props: ReviewClientProps) {
  const { dueWords, duePhrases, practiceWords = [] } = props;
  const [practice, setPractice] = useState(false);
  const hasDue = dueWords.length + duePhrases.length > 0;

  if (!hasDue && !practice) {
    return <NothingDue practiceCount={practiceWords.length} languageCode={props.languageCode ?? null} onPractice={() => setPractice(true)} />;
  }

  return <Sitting key={practice ? 'practice' : 'review'} {...props} practice={practice} />;
}

/** The fetch behind the can-do: the first due can-do, or null when none / it failed. */
async function fetchDueCanDo(): Promise<DueCanDo | null> {
  const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(CAN_DO_TIMEOUT_MS) : undefined;
  try {
    const r = await fetch('/api/can-dos/due?limit=1', { signal });
    const json = r.ok ? await r.json() : null;
    return Array.isArray(json?.data) ? ((json.data[0] as DueCanDo | undefined) ?? null) : null;
  } catch {
    return null;
  }
}

function CaughtUp({ practiceCount, onPractice }: { practiceCount: number; onPractice: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] animate-spring-in max-w-md mx-auto text-center">
      <Fox pose="proud" size="lg" aria-label="All caught up" />
      <h2 className="text-2xl font-bold text-foreground mb-1 mt-2">All caught up!</h2>
      <p className="text-text-secondary mb-6 max-w-xs">
        {practiceCount > 0
          ? `No reviews due right now. You can practise ${practiceCount} words if you'd like.`
          : 'Nothing to review yet. Learn new words to grow your queue.'}
      </p>
      {practiceCount > 0 ? (
        <ThumbButton onClick={onPractice} size="lg" variant="primary" fullWidth={false}>
          Practice now ({practiceCount} words)
        </ThumbButton>
      ) : (
        <Link href="/paths" className="block w-full">
          <ThumbButton size="lg" variant="primary">
            Go to Learning Paths
          </ThumbButton>
        </Link>
      )}
    </div>
  );
}

/**
 * No word or phrase is due, but a can-do may be (it is offered once its scene's
 * items are known, which is exactly when nothing else is due). Show it before
 * the caught-up screen; none, a failed fetch, or a settled test all end there.
 */
function NothingDue({
  practiceCount,
  languageCode,
  onPractice,
}: {
  practiceCount: number;
  languageCode: string | null;
  onPractice: () => void;
}) {
  const [canDo, setCanDo] = useState<'loading' | 'none' | DueCanDo>('loading');
  useEffect(() => {
    let live = true;
    void fetchDueCanDo().then((first) => {
      if (live) setCanDo(first ?? 'none');
    });
    return () => {
      live = false;
    };
  }, []);

  if (canDo === 'loading') return <Notice text="One moment…" />;
  if (canDo === 'none') return <CaughtUp practiceCount={practiceCount} onPractice={onPractice} />;
  return (
    <CanDoTest
      key={canDo.can_do_id}
      canDo={canDo}
      languageCode={languageCode ?? 'pt'}
      onSettled={() => setCanDo('none')}
    />
  );
}

type CanDoState = 'idle' | 'none' | DueCanDo;

interface SittingProps extends ReviewClientProps {
  practice: boolean;
}

function Sitting({
  practice,
  dueWords,
  duePhrases,
  practiceWords = NO_WORDS,
  wordPool = NO_POOL,
  wordFamiliesMap = NO_MAP,
  phraseWordMap = NO_PHRASE_MAP,
  languageCode = null,
  dueTotal,
  fragileDueTotal,
  sittingSize = 20,
  learnerName = null,
  sceneId = null,
  insightState,
}: SittingProps) {
  const words = useMemo(() => (practice ? practiceWords : dueWords), [practice, practiceWords, dueWords]);
  const phrases = useMemo(() => (practice ? [] : duePhrases), [practice, duePhrases]);

  // ---- the items, as the cards see them ---------------------------------
  const views = useMemo(() => {
    const map = new Map<string, ItemView>();
    for (const w of words) {
      const v = wordView(w, wordPool, wordFamiliesMap[w.word_id]);
      map.set(v.key, v);
    }
    for (const p of phrases) {
      const v = phraseView(p, phraseWordMap[p.phrase_id]);
      map.set(v.key, v);
    }
    return map;
  }, [words, phrases, wordPool, wordFamiliesMap, phraseWordMap]);

  const sittingItems = useMemo(
    () => interleave(words.map(sittingItemOfWord), phrases.map(sittingItemOfPhrase)),
    [words, phrases],
  );

  // Four English options per item, fixed for the sitting (seeded by the item),
  // or null when the pool cannot supply three genuinely different ones.
  const listenOptions = useMemo(() => {
    const wordMeanings = Array.from(new Set([...wordPool.map((p) => p.meaning_en), ...words.map((w) => w.meaning_en)]));
    const phraseMeanings = Array.from(new Set(phrases.map((p) => p.text_en)));
    const map = new Map<string, string[] | null>();
    for (const v of views.values()) {
      const pool = v.kind === 'word' ? wordMeanings : phraseMeanings;
      map.set(v.key, buildListenOptions(v.meaning, pool, mulberry32(hashSeed(v.key))));
    }
    return map;
  }, [views, wordPool, words, phrases]);

  // ---- session state: a ref for synchronous reads, state for rendering ---
  const [state, setState] = useState<SessionState>(() =>
    createSession({ items: sittingItems, source: practice ? 'practice' : 'review', now: Date.now() }),
  );
  const stateRef = useRef(state);
  const apply = useCallback((fn: (s: SessionState) => SessionState) => {
    const next = fn(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  // ---- the browser: speech support and the override history ---------------
  // Nothing is drawn until the browser is known: the first paint on the server
  // (and hydration) is a blank notice, so a card never flips from typing to
  // saying once the mic check lands.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const speech = useSyncExternalStore(
    subscribeNever,
    () => Boolean(languageCode) && isSpeechAnswerAvailable(),
    () => false,
  );
  const [history, setHistory] = useState<boolean[]>(() => readSpokenHistory(browserStorage()));
  const historyRef = useRef(history);

  // ---- recording: one POST per presentation, chained per item ------------
  const [inFlight, setInFlight] = useState(0);
  const chains = useRef(new Map<string, Promise<void>>());
  const failureToasted = useRef(false);

  const send = useCallback(
    (post: PostRequest, direction: 'production' | 'recognition') => {
      const run = async (): Promise<void> => {
        let res: { ok: boolean; known?: boolean } = { ok: false };
        try {
          const isWord = post.kind === 'word';
          const r = await fetch(isWord ? '/api/reviews/record' : '/api/reviews/record-phrase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...(isWord ? { wordId: post.id } : { phraseId: post.id }),
              direction,
              rating: post.rating,
              source: practice ? 'practice' : 'review',
              presentation: Math.min(post.presentation, 10),
            }),
          });
          if (r.ok) {
            const json = await r.json().catch(() => null);
            const known = json?.data?.known;
            if (typeof known === 'boolean') res = { ok: true, known };
          }
        } catch {
          // handled below: the rating alone decides whether it comes back
        }
        if (!res.ok && !failureToasted.current) {
          failureToasted.current = true;
          toastError("Couldn't save that answer. Check your connection; it will come back around.");
        }
        apply((s) => settlePost(s, post.key, post.rating, res, Date.now()));
      };
      setInFlight((n) => n + 1);
      const prev = chains.current.get(post.key) ?? Promise.resolve();
      const next = prev
        .then(run)
        .catch(() => {})
        .finally(() => setInFlight((n) => n - 1));
      chains.current.set(post.key, next);
    },
    [practice, apply],
  );

  // ---- the card on the table ---------------------------------------------
  const handled = useRef(new Set<number>());

  const commit = useCallback(
    (entry: QueueEntry, c: CardCommit) => {
      if (handled.current.has(entry.id)) return;
      handled.current.add(entry.id);
      if (c.spoken) {
        const next = pushSpoken(historyRef.current, c.overridden);
        historyRef.current = next;
        writeSpokenHistory(browserStorage(), next);
        setHistory(next);
      }
      const presentation = toPresentationResult(entry.stage, c.result);
      let post = null as PostRequest | null;
      apply((s) => {
        const r = completePresentation(s, presentation, Date.now());
        post = r.post;
        return r.state;
      });
      if (post) send(post, c.result.how === 'listen' ? 'recognition' : 'production');
    },
    [apply, send],
  );

  const continueTeach = useCallback(
    (entry: QueueEntry) => {
      if (handled.current.has(entry.id)) return;
      handled.current.add(entry.id);
      apply((s) => completeTeach(s, Date.now()));
    },
    [apply],
  );

  const finishForNow = useCallback(() => {
    let posts: PostRequest[] = [];
    apply((s) => {
      const r = parkRemaining(s);
      posts = r.posts;
      return r.state;
    });
    for (const post of posts) send(post, 'production');
  }, [apply, send]);

  // ---- when only re-asks remain and none is due yet -----------------------
  const waitUntil = state.waitUntil;
  useEffect(() => {
    if (waitUntil == null) return;
    // A clock deadline (the re-ask spacing rule), not an animation beat, so it
    // is deliberately not scaled by usePace.
    const id = setTimeout(() => apply((s) => startNext(s, Date.now())), Math.max(0, waitUntil - Date.now()) + 50);
    return () => clearTimeout(id);
  }, [waitUntil, apply]);

  // ---- the can-do, after the cards ---------------------------------------
  const finished = isFinished(state);
  const settled = finished && inFlight === 0;
  const [canDo, setCanDo] = useState<CanDoState>('idle');
  const canDoNow: CanDoState = practice ? 'none' : canDo;
  const canDoRequested = useRef(false);
  useEffect(() => {
    if (!settled || canDoRequested.current) return;
    canDoRequested.current = true;
    if (practice) return;
    void fetchDueCanDo().then((first) => setCanDo(first ?? 'none'));
  }, [settled, practice]);

  // ---- insight (spacing effect), as before --------------------------------
  const [reviewInsight] = useState<InsightDefinition | null>(() => {
    if (!insightState) return null;
    return getEligibleInsight('review_start', {
      seenInsightIds: new Set(insightState.seenIds),
      insightsShownToday: insightState.shownToday,
      totalMnemonicsViewed: 0,
      totalScenesCompleted: 0,
      totalWordsLearned: 0,
    });
  });
  const [showInsight, setShowInsight] = useState(Boolean(reviewInsight));
  useEffect(() => {
    if (!reviewInsight) return;
    fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insightId: reviewInsight.id, action: 'shown' }),
    }).catch(() => {});
  }, [reviewInsight]);

  // ---- warm the next few clips -------------------------------------------
  const upcoming = state.queue.slice(0, 3).map((e) => e.key).join('|');
  useEffect(() => {
    const urls = upcoming
      .split('|')
      .filter(Boolean)
      .map((key) => views.get(key)?.audioUrl);
    preloadAudioUrls(urls);
  }, [upcoming, views]);

  // ---- render --------------------------------------------------------------
  const current = state.current;
  const progress = progressOf(state);
  const dueRemaining = practice ? 0 : Math.max(0, (dueTotal ?? sittingItems.length) - sittingItems.length);

  if (finished) {
    if (!settled) return <Notice text="Saving your answers…" />;
    if (canDoNow === 'idle') return <Notice text="One more thing…" />;
    if (canDoNow !== 'none') {
      return (
        <CanDoTest
          key={canDoNow.can_do_id}
          canDo={canDoNow}
          languageCode={languageCode ?? 'pt'}
          onSettled={() => setCanDo('none')}
        />
      );
    }
    return (
      <ReviewComplete
        summary={summarize(state, {
          dueRemaining,
          sittingSize,
          fragileRemaining: fragileDueTotal == null ? undefined : fragileRemaining(fragileDueTotal, sittingItems),
        })}
        practice={practice}
        sceneId={sceneId}
      />
    );
  }

  if (!mounted) return <Notice text="" />;

  const header = (
    <>
      <HeaderPortal>
        <span className="text-sm text-text-secondary truncate">
          {practice ? 'Practice' : 'Review'} &middot; {Math.min(progress.done + 1, progress.total)} of {progress.total}
          {progress.comingBack > 0 && ` · ${progress.comingBack} coming back`}
        </span>
      </HeaderPortal>
      <ProgressBarPortal current={progress.done} total={progress.total} />
    </>
  );

  const footer = (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={finishForNow}
        className="min-h-11 px-4 text-sm font-semibold text-text-secondary underline underline-offset-2"
      >
        Finish for now
      </button>
    </div>
  );

  if (!current) {
    return (
      <>
        {header}
        <Breather until={waitUntil} count={state.queue.length} />
        {footer}
      </>
    );
  }

  const item = state.items[current.key];
  const view = views.get(current.key);
  if (!item || !view) return null;

  // Pure in the entry and the environment, and a card only reads it when it
  // mounts, so it cannot flip under the learner's hands.
  const mode: CardMode = chooseMode(current, item, {
    speechAvailable: speech,
    recentSpoken: history,
    canListen: Boolean(listenOptions.get(item.key)),
  });

  let card;
  if (mode === 'teach') {
    card = <TeachCard key={current.id} view={view} languageCode={languageCode} onContinue={() => continueTeach(current)} />;
  } else if (mode === 'listen') {
    card = (
      <ListenCard
        key={current.id}
        view={view}
        options={listenOptions.get(item.key) ?? []}
        languageCode={languageCode}
        onCommit={(c) => commit(current, c)}
      />
    );
  } else {
    card = (
      <ProductionCard
        key={current.id}
        view={view}
        stage={current.stage}
        missed={state.progress[current.key]?.ladder?.missed ?? []}
        mode={mode}
        typingBecauseOverrides={speech && tooManyOverrides(history)}
        speechAvailable={speech}
        languageCode={languageCode}
        learnerName={learnerName}
        onCommit={(c) => commit(current, c)}
      />
    );
  }

  return (
    <>
      {header}
      {showInsight && reviewInsight && current.stage !== 'teach' && (
        <div className="mb-4">
          <InsightCard insight={reviewInsight} onDismiss={() => setShowInsight(false)} />
        </div>
      )}
      {card}
      {footer}
    </>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[40vh] text-center">
      <p role="status" className="text-text-secondary">
        {text}
      </p>
    </div>
  );
}

/** Only re-asks are left and none is due for a few seconds: a short, honest pause. */
function Breather({ until, count }: { until: number | null; count: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = until == null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
  return (
    <Card className="text-center">
      <Fox pose="thinking" size="md" aria-label="Taking a breath" />
      <h2 className="mt-2 text-xl font-bold text-foreground">A short pause</h2>
      <p role="status" aria-live="polite" className="mt-1 text-text-secondary">
        {count} {count === 1 ? 'card is' : 'cards are'} coming back
        {seconds > 0 ? ` in ${seconds}s. Letting them rest makes them stick.` : '.'}
      </p>
    </Card>
  );
}
