import { describe, expect, it } from 'vitest';
import { makeWord } from './stage';

const st = (w: string) => makeWord(w).stage;

describe('stage classification', () => {
  it('stage 3: open syllables of single letters', () => {
    expect(st('Ma-ma')).toBe(3);
    expect(st('O-ma')).toBe(3);
  });
  it('stage 4: closed syllables, doubled consonants', () => {
    expect(st('Mut')).toBe(4);
    expect(st('Son-ne')).toBe(4);
    expect(st('Ball')).toBe(4);
  });
  it('stage 5: grapheme groups', () => {
    expect(st('Schu-le')).toBe(5);
    expect(st('Ei-mer')).toBe(5);
    expect(st('ich')).toBe(5);
  });
  it('stage 6: consonant clusters', () => {
    expect(st('Blu-me')).toBe(6);
    expect(st('Brot')).toBe(6);
    expect(st('Fla-sche')).toBe(6); // cluster beats group
    expect(st('Milch')).toBe(6);
    expect(st('Stra-ße')).toBe(6);
  });
  it('builds keys and id', () => {
    expect(makeWord('Ball').keys.sort()).toEqual(['a', 'b', 'l']);
    expect(makeWord('Ei-mer').keys.sort()).toEqual(['e', 'ei', 'm', 'r']);
    expect(makeWord('Schu-le').id).toBe('wort-schule');
    expect(makeWord('Schu-le')).toEqual({
      id: 'wort-schule',
      kind: 'wort',
      text: 'Schule',
      syllables: [['Sch', 'u'], ['l', 'e']],
      stage: 5,
      keys: ['sch', 'u', 'l', 'e'],
    });
  });
});
