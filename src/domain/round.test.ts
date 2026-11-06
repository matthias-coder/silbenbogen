import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../testing/rng';
import { buildRound } from './round';
import type { Item, Stage } from './types';

const fake = (id: string, stage: Stage): Item => ({
  id,
  kind: 'silbe',
  text: id,
  syllables: [[id]],
  stage,
  keys: [id],
});

const noRepeat = (r: Item[]) =>
  r.forEach((it, i) => {
    if (i) expect(it.id).not.toBe(r[i - 1].id);
  });

describe('buildRound', () => {
  it('handles empty and single-item pools', () => {
    expect(buildRound([])).toEqual([]);
    expect(buildRound([fake('a', 1)]).map((i) => i.id)).toEqual(Array(10).fill('a'));
  });

  it('never repeats directly with two items', () => {
    const two = buildRound([fake('a', 1), fake('b', 1)], mulberry32(1));
    expect(two).toHaveLength(10);
    noRepeat(two);
  });

  it('uses all distinct items when the pool is large enough', () => {
    const many = Array.from({ length: 30 }, (_, i) => fake('s' + i, 1));
    expect(new Set(buildRound(many, mulberry32(2)).map((i) => i.id)).size).toBe(10);
  });

  it('never repeats a task while a small stage sits next to a large one', () => {
    const many = Array.from({ length: 30 }, (_, i) => fake('s' + i, 1));
    const mixed = [...many, fake('w1', 3), fake('w2', 3), fake('w3', 3)];
    let words = 0;
    for (let seed = 0; seed < 200; seed++) {
      const r = buildRound(mixed, mulberry32(seed));
      expect(new Set(r.map((i) => i.id)).size).toBe(10);
      noRepeat(r);
      words += r.filter((i) => i.stage === 3).length;
    }
    expect(words / 2000).toBeGreaterThan(0.25);
    expect(words / 2000).toBeLessThanOrEqual(0.3);
  });

  it('weights balanced stages equally', () => {
    const a = Array.from({ length: 30 }, (_, i) => fake('s' + i, 1));
    const b = Array.from({ length: 30 }, (_, i) => fake('w' + i, 3));
    let words = 0;
    for (let seed = 0; seed < 200; seed++) {
      const r = buildRound([...a, ...b], mulberry32(seed));
      expect(new Set(r.map((i) => i.id)).size).toBe(10);
      words += r.filter((i) => i.stage === 3).length;
    }
    expect(words / 2000).toBeGreaterThan(0.35);
    expect(words / 2000).toBeLessThan(0.65);
  });

  it('is reproducible with the same seed', () => {
    const many = Array.from({ length: 30 }, (_, i) => fake('s' + i, 1));
    const mixed = [...many, fake('w1', 3), fake('w2', 3), fake('w3', 3)];
    expect(buildRound(mixed, mulberry32(7))).toEqual(buildRound(mixed, mulberry32(7)));
  });
});
