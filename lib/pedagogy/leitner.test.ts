import { describe, expect, it } from 'vitest';
import {
  applyCorrect,
  applyWrong,
  buildQueue,
  currentItem,
  isComplete,
  MAX_TRIES_PER_ITEM,
  wasParked,
} from './leitner';

const three = () =>
  buildQueue(
    ['a', 'b', 'c'].map((id) => ({ itemId: id, itemType: 'word' as const, refId: id })),
    { requiredCueTypes: 2 },
  );

describe('Leitner queue', () => {
  it('passes an item after two different cue types', () => {
    let q = three();
    q = applyCorrect(q, 'recognition'); // a: 1 cue, cursor → b
    expect(currentItem(q)?.itemId).toBe('b');
    q = applyCorrect(q, 'recognition'); // b
    q = applyCorrect(q, 'recognition'); // c, cursor wraps → a
    expect(currentItem(q)?.itemId).toBe('a');
    q = applyCorrect(q, 'production'); // a passes
    expect(q.completed.map((i) => i.itemId)).toEqual(['a']);
    expect(q.items.map((i) => i.itemId)).toEqual(['b', 'c']);
  });

  it('a wrong answer re-queues the item two slots back and never counts a cue', () => {
    let q = three();
    q = applyWrong(q, 'production');
    expect(q.items.map((i) => i.itemId)).toEqual(['b', 'c', 'a']);
    expect(q.items[2].tries).toBe(1);
    expect(q.items[2].cueTypesPassed).toEqual([]);
  });

  it('parks an item for the review queue after MAX_TRIES_PER_ITEM presentations instead of looping forever', () => {
    let q = buildQueue([{ itemId: 'x', itemType: 'phrase', refId: 'x' }], { requiredCueTypes: 2 });
    for (let i = 0; i < MAX_TRIES_PER_ITEM - 1; i++) {
      q = applyWrong(q, 'production');
      expect(isComplete(q)).toBe(false);
    }
    q = applyWrong(q, 'production');
    expect(isComplete(q)).toBe(true);
    expect(q.completed).toHaveLength(1);
    expect(q.completed[0].lastResult).toBe('wrong');
    expect(wasParked(q.completed[0], 2)).toBe(true);
  });

  it('a passed item is not reported as parked', () => {
    let q = buildQueue([{ itemId: 'x', itemType: 'word', refId: 'x' }], { requiredCueTypes: 1 });
    q = applyCorrect(q, 'recognition');
    expect(wasParked(q.completed[0], 1)).toBe(false);
  });

  it('the cursor stays valid when the parked item was last', () => {
    let q = three();
    // Push c to the front of attention: wrong on a and b moves them back.
    q = applyWrong(q, 'production'); // b c a
    q = applyWrong(q, 'production'); // c a b
    for (let i = 0; i < MAX_TRIES_PER_ITEM; i++) q = applyWrong(q, 'production');
    expect(q.cursor).toBeLessThan(Math.max(q.items.length, 1));
    expect(q.items.length + q.completed.length).toBe(3);
  });
});
