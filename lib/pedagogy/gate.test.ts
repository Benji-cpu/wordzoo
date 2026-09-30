import { describe, expect, it } from 'vitest';
import {
  GATE_THRESHOLD,
  decideGate,
  gateBody,
  lockInFirstLabel,
  paceNote,
  practiseLabel,
  reviewMinutes,
  TRIP_TARGET_SCENE_ID,
  type PaceScene,
} from './gate';

describe('decideGate', () => {
  it('opens an unstarted scene at or under the threshold', () => {
    expect(decideGate({ fragileDue: 0, sceneStarted: false, sceneCompleted: false }).open).toBe(true);
    expect(decideGate({ fragileDue: GATE_THRESHOLD, sceneStarted: false, sceneCompleted: false }).open).toBe(true);
  });

  it('closes an unstarted scene above the threshold', () => {
    const g = decideGate({ fragileDue: GATE_THRESHOLD + 1, sceneStarted: false, sceneCompleted: false });
    expect(g.open).toBe(false);
    expect(g.fragileDue).toBe(9);
    expect(g.threshold).toBe(8);
  });

  it('never blocks a started or completed scene', () => {
    expect(decideGate({ fragileDue: 99, sceneStarted: true, sceneCompleted: false }).open).toBe(true);
    expect(decideGate({ fragileDue: 99, sceneStarted: false, sceneCompleted: true }).open).toBe(true);
  });

  it('honours a custom threshold', () => {
    expect(decideGate({ fragileDue: 3, sceneStarted: false, sceneCompleted: false, threshold: 2 }).open).toBe(false);
  });
});

describe('copy', () => {
  it('pluralises the body', () => {
    expect(gateBody(1)).toBe('1 item is still fragile. A short round now makes them stick, then this scene opens.');
    expect(gateBody(12)).toContain('12 items are still fragile');
  });

  it('labels the actions', () => {
    expect(practiseLabel(12)).toBe('Practise 12 now');
    expect(lockInFirstLabel(12)).toBe('Lock in 12 first');
  });
});

describe('reviewMinutes', () => {
  it('is 20 s a card, rounded up', () => {
    expect(reviewMinutes(0)).toBe(0);
    expect(reviewMinutes(1)).toBe(1);
    expect(reviewMinutes(3)).toBe(1);
    expect(reviewMinutes(4)).toBe(2);
    expect(reviewMinutes(20)).toBe(7);
  });
});

describe('paceNote', () => {
  const now = new Date('2026-09-30T10:00:00Z');
  const scenes = (doneCount: number): PaceScene[] => [
    { id: 'a', title: 'A', completed: doneCount > 0 },
    { id: 'b', title: 'B', completed: doneCount > 1 },
    { id: 'c', title: 'Chegando', completed: doneCount > 2 },
    { id: TRIP_TARGET_SCENE_ID, title: 'Ceia de Natal', completed: doneCount > 3 },
  ];

  it('nudges when nothing was completed in the last 14 days', () => {
    expect(paceNote({ scenes: scenes(1), completedRecently: 0, tripDate: '2026-12-20', now })).toBe(
      'Do one scene this week to reach Ceia de Natal before 20 Dec',
    );
  });

  it('projects the target date from the recent rate', () => {
    // 3 left at 1 scene / 14 days = 42 days -> 11 Nov
    expect(paceNote({ scenes: scenes(1), completedRecently: 1, tripDate: '2026-12-20', now })).toBe(
      'At this pace: Ceia de Natal by 11 Nov',
    );
  });

  it('flags a projection that lands after the trip', () => {
    // 1 scene / 14 days, 3 left -> 42 days; trip in 10 days
    expect(paceNote({ scenes: scenes(1), completedRecently: 1, tripDate: '2026-10-10', now })).toBe(
      'At this pace: Ceia de Natal by 11 Nov (after 10 Oct)',
    );
  });

  it('is silent with no trip, no target scene, or the target done', () => {
    expect(paceNote({ scenes: scenes(1), completedRecently: 1, tripDate: null, now })).toBeNull();
    expect(paceNote({ scenes: [{ id: 'x', title: 'X', completed: false }], completedRecently: 1, tripDate: '2026-12-20', now })).toBeNull();
    expect(paceNote({ scenes: scenes(4), completedRecently: 1, tripDate: '2026-12-20', now })).toBeNull();
  });
});
