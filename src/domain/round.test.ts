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

  describe('with weights', () => {
    const share = (pool: Item[], weight: (i: Item) => number, pred: (i: Item) => boolean) => {
      const rng = mulberry32(7);
      let hits = 0;
      for (let n = 0; n < 2000; n++) if (pred(buildRound(pool, rng, 1, weight)[0])) hits++;
      return hits / 2000;
    };

    it('prefers heavier items', () => {
      const pool = [fake('a', 3), fake('b', 3)];
      const s = share(pool, (i) => (i.id === 'a' ? 8 : 1), (i) => i.id === 'a');
      expect(s).toBeGreaterThan(0.8);
      expect(s).toBeLessThan(0.95);
    });

    it('keeps stage balance', () => {
      const pool = [fake('s1', 1), fake('s3', 3)];
      const s = share(pool, (i) => (i.id === 's3' ? 8 : 1), (i) => i.stage === 1);
      expect(s).toBeGreaterThan(0.4);
      expect(s).toBeLessThan(0.6);
    });

    it('never repeats directly and uses every item before repeating', () => {
      const pool = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => fake(id, 6));
      const weight = (i: Item) => (i.id === 'a' ? 8 : 1);
      for (let seed = 1; seed <= 200; seed++) {
        const r = buildRound(pool, mulberry32(seed), 10, weight);
        noRepeat(r);
        expect(new Set(r.slice(0, 6).map((i) => i.id)).size).toBe(6);
      }
    });

    it('also weights the fallback once every item was used', () => {
      const pool = [fake('a', 3), fake('b', 3), fake('c', 3)];
      const rng = mulberry32(3);
      let a = 0;
      let total = 0;
      for (let n = 0; n < 500; n++) {
        const r = buildRound(pool, rng, 6, (i) => (i.id === 'a' ? 50 : 1));
        for (const it of r.slice(3)) {
          total++;
          if (it.id === 'a') a++;
        }
      }
      expect(a / total).toBeGreaterThan(0.45);
    });
  });
});
