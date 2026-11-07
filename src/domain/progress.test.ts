import { describe, expect, it } from 'vitest';
import { emptyProgress, markAllSeen, recordOutcome, weightOf, type Outcome, type Progress } from './progress';

const run = (outcomes: Outcome[], id = 'wort-mama', start: Progress = emptyProgress()) => {
  let p = start;
  let learnedNow = false;
  for (const o of outcomes) ({ progress: p, learnedNow } = recordOutcome(p, id, o));
  return { p, learnedNow };
};

describe('recordOutcome', () => {
  it('three first-try reads make an item learned and fresh', () => {
    expect(run(['first', 'first']).p.items['wort-mama'].learned).toBe(false);
    const { p, learnedNow } = run(['first', 'first', 'first']);
    expect(learnedNow).toBe(true);
    expect(p.items['wort-mama']).toMatchObject({ streak: 3, learned: true, fresh: true });
  });

  it('a stumble pauses the streak', () => {
    expect(run(['first', 'first', 'later']).p.items['wort-mama'].streak).toBe(2);
    const { p, learnedNow } = run(['first', 'first', 'later', 'first']);
    expect(learnedNow).toBe(true);
    expect(p.items['wort-mama'].learned).toBe(true);
  });

  it('a skip resets the streak', () => {
    const { p } = run(['first', 'first', 'skipped', 'first']);
    expect(p.items['wort-mama']).toMatchObject({ streak: 1, learned: false });
  });

  it('learned stays learned after a skip and is not reported again', () => {
    const { p, learnedNow } = run(['first', 'first', 'first', 'skipped', 'first', 'first', 'first']);
    expect(p.items['wort-mama'].learned).toBe(true);
    expect(learnedNow).toBe(false);
  });

  it('does not mutate its input', () => {
    const p = emptyProgress();
    recordOutcome(p, 'wort-mama', 'first');
    expect(p).toEqual(emptyProgress());
    const q = run(['first']).p;
    const before = JSON.stringify(q);
    recordOutcome(q, 'wort-mama', 'skipped');
    expect(JSON.stringify(q)).toBe(before);
  });
});

describe('weightOf', () => {
  it('weights unknown, hard and sure items, never 0', () => {
    expect(weightOf(emptyProgress(), 'wort-x')).toBe(3);
    expect(weightOf(run(['skipped', 'skipped']).p, 'wort-mama')).toBe(8);
    expect(weightOf(run(['first', 'first', 'first', 'first']).p, 'wort-mama')).toBe(1);
    expect(weightOf(run(['first', 'first', 'first', 'first', 'first', 'first']).p, 'wort-mama')).toBe(1);
    expect(weightOf(run(['later']).p, 'wort-mama')).toBe(3);
  });
});

describe('markAllSeen', () => {
  it('clears fresh only', () => {
    const { p } = run(['first', 'first', 'first']);
    const seen = markAllSeen(p);
    expect(seen.items['wort-mama']).toMatchObject({ learned: true, fresh: false, streak: 3 });
    expect(p.items['wort-mama'].fresh).toBe(true);
  });
});
