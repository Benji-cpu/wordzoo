/**
 * Pedagogy v2 in-session Leitner queue.
 *
 * Wraps the per-scene drill queue: items the learner has been introduced to
 * but not yet "passed" (where "passed" means correctly retrieved under K
 * different cue types — typically K=2). Wrong answers re-queue the item to
 * resurface 2-3 items later; correct answers either pass (remove) or push
 * the item to the next cue type still owed.
 *
 * Pure functions only — owners persist via JSONB on user_scene_progress.
 */

export type CueType = 'recognition' | 'production' | 'cloze' | 'listening' | 'pattern';

export interface DrillItem {
  itemId: string;                  // wordId or scene_pattern_exercise.id
  itemType: 'word' | 'pattern';
  refId: string;                   // mirror of itemId — kept for forward-compat
  tries: number;
  cueTypesPassed: CueType[];
  lastResult: 'correct' | 'wrong' | 'guessed' | null;
  lastConfidence: 'knew_it' | 'guessed' | null;
}

export interface DrillQueue {
  schemaVersion: 1;
  items: DrillItem[];
  cursor: number;
  requiredCueTypes: number;
  completed: DrillItem[];
}

export interface SerializedDrillQueue {
  schemaVersion: 1;
  items: DrillItem[];
  cursor: number;
  requiredCueTypes: number;
  completed: DrillItem[];
}

export function buildQueue(
  items: Array<Pick<DrillItem, 'itemId' | 'itemType' | 'refId'>>,
  options: { requiredCueTypes?: number; seedPassedCueTypes?: Partial<Record<string, CueType[]>> } = {},
): DrillQueue {
  const seed = options.seedPassedCueTypes ?? {};
  return {
    schemaVersion: 1,
    items: items.map((it) => ({
      itemId: it.itemId,
      itemType: it.itemType,
      refId: it.refId,
      tries: 0,
      cueTypesPassed: [...(seed[it.itemId] ?? [])],
      lastResult: null,
      lastConfidence: null,
    })),
    cursor: 0,
    requiredCueTypes: options.requiredCueTypes ?? 2,
    completed: [],
  };
}

export function currentItem(q: DrillQueue): DrillItem | null {
  if (q.cursor < 0 || q.cursor >= q.items.length) return null;
  return q.items[q.cursor];
}

export function isPassed(item: DrillItem, requiredCueTypes: number): boolean {
  return new Set(item.cueTypesPassed).size >= requiredCueTypes;
}

/**
 * Apply a correct answer at the cursor:
 *  - mark cueType passed (deduped)
 *  - if isPassed → move item to completed[], drop from items[], cursor stays
 *  - else → advance cursor (item resurfaces later)
 */
export function applyCorrect(q: DrillQueue, cueType: CueType, confidence: 'knew_it' | 'guessed' | null = null): DrillQueue {
  const item = currentItem(q);
  if (!item) return q;

  const cueTypesPassed = item.cueTypesPassed.includes(cueType)
    ? item.cueTypesPassed
    : [...item.cueTypesPassed, cueType];

  const updated: DrillItem = {
    ...item,
    cueTypesPassed,
    tries: item.tries + 1,
    lastResult: confidence === 'guessed' ? 'guessed' : 'correct',
    lastConfidence: confidence,
  };

  if (isPassed(updated, q.requiredCueTypes)) {
    const items = [...q.items];
    items.splice(q.cursor, 1);
    return {
      ...q,
      items,
      cursor: items.length === 0 ? 0 : Math.min(q.cursor, items.length - 1),
      completed: [...q.completed, updated],
    };
  }

  // Not yet passed — replace in place, advance cursor
  const items = q.items.map((it, i) => (i === q.cursor ? updated : it));
  const nextCursor = items.length === 0 ? 0 : (q.cursor + 1) % items.length;
  return { ...q, items, cursor: nextCursor };
}

/**
 * Apply a wrong answer at the cursor: bump tries, push the item further
 * back in the queue (default 2 slots) so the learner gets some buffer
 * before retrying.
 */
export function applyWrong(q: DrillQueue, cueType: CueType, gap: number = 2): DrillQueue {
  const item = currentItem(q);
  if (!item) return q;
  const updated: DrillItem = {
    ...item,
    tries: item.tries + 1,
    lastResult: 'wrong',
    lastConfidence: null,
    // wrong answers don't count cueType as passed; if they had passed it
    // before, they keep that — no demotion within the session.
  };
  const without = q.items.filter((_, i) => i !== q.cursor);
  const insertAt = Math.min(q.cursor + gap, without.length);
  const items = [...without.slice(0, insertAt), updated, ...without.slice(insertAt)];
  // Cursor stays at q.cursor — that's now the *next* item
  const nextCursor = items.length === 0 ? 0 : Math.min(q.cursor, items.length - 1);
  void cueType;
  return { ...q, items, cursor: nextCursor };
}

export function isComplete(q: DrillQueue): boolean {
  return q.items.length === 0;
}

export function pickNextCueType(
  item: DrillItem,
  available: readonly CueType[],
): CueType | null {
  // Prefer cue types not yet passed; round-robin among them.
  const passed = new Set(item.cueTypesPassed);
  const owed = available.filter((c) => !passed.has(c));
  if (owed.length === 0) return available[0] ?? null;
  return owed[Math.floor(Math.random() * owed.length)];
}

export function summarizeQueue(q: DrillQueue): {
  active: number;
  completed: number;
  totalTries: number;
} {
  return {
    active: q.items.length,
    completed: q.completed.length,
    totalTries: [...q.items, ...q.completed].reduce((sum, it) => sum + it.tries, 0),
  };
}
