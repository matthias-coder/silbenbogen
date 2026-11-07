import { describe, expect, it } from 'vitest';
import { buildPool, countByStage, itemsForStage, randomSyllables, reconcileStages } from './pool';

const D = new Set(['a', 'e', 'i', 'o', 'u', 'm', 'l', 's', 'n', 'f']);

describe('randomSyllables', () => {
  it('builds onset + vowel syllables for stage 1', () => {
    const s1 = randomSyllables(1, D);
    expect(s1).toHaveLength(25);
    expect(s1).toContainEqual({
      id: 'silbe-ma',
      kind: 'silbe',
      text: 'Ma',
      syllables: [['M', 'a']],
      stage: 1,
      keys: ['m', 'a'],
    });
  });

  it('builds vowel + coda syllables for stage 2', () => {
    const s2 = randomSyllables(2, D);
    expect(s2).toHaveLength(25);
    expect(s2.map((i) => i.text)).toContain('Am');
    expect(s2.find((i) => i.text === 'Am')!.id).toBe('silbe-am');
    expect(s2.find((i) => i.text === 'Am')!.keys).toEqual(['a', 'm']);
  });

  it('never uses c q x y v ss or groups', () => {
    expect(randomSyllables(1, new Set([...D, 'c', 'q', 'x', 'y', 'v', 'ß', 'sch']))).toHaveLength(25);
  });

  it('uses h j w b d g z only in front', () => {
    expect(randomSyllables(2, new Set([...D, 'h', 'j', 'w', 'b', 'd', 'g', 'z']))).toHaveLength(25);
  });

  it('drops blocked syllables', () => {
    expect(randomSyllables(1, new Set(['p', 'o', 'i', 'a'])).map((i) => i.text)).toEqual(['Pa']);
  });

  it('counts umlauts as vowels when known', () => {
    expect(randomSyllables(1, new Set(['m', 'ä'])).map((i) => i.text)).toEqual(['Mä']);
  });
});

describe('itemsForStage', () => {
  it('treats groups independently of single letters', () => {
    expect(itemsForStage(5, new Set(['e', 'i', 'm', 'r'])).map((i) => i.text)).not.toContain('Eimer');
    expect(itemsForStage(5, new Set(['ei', 'e', 'm', 'r'])).map((i) => i.text)).toContain('Eimer');
    expect(itemsForStage(4, new Set(['b', 'a', 'l'])).map((i) => i.text)).toContain('Ball');
  });
});

describe('countByStage / buildPool / reconcileStages', () => {
  it('counts per stage', () => {
    expect(countByStage(new Set())).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
    expect(countByStage(D)[1]).toBe(25);
  });

  it('builds the pool from the selected stages', () => {
    expect(buildPool(new Set(D), [1, 3]).length).toBe(
      countByStage(D)[1] + countByStage(D)[3],
    );
  });

  it('removes stages without items', () => {
    expect(reconcileStages([1, 5], { 1: 25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 })).toEqual([1]);
  });
});
