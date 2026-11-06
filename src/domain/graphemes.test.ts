import { describe, expect, it } from 'vitest';
import { isVowel, keyOf, parseWord, splitGraphemes } from './graphemes';

describe('splitGraphemes', () => {
  it('splits into graphemes', () => {
    expect(splitGraphemes('Schu')).toEqual(['Sch', 'u']);
    expect(splitGraphemes('Ball')).toEqual(['B', 'a', 'll']);
    expect(splitGraphemes('Stra')).toEqual(['S', 't', 'r', 'a']);
    expect(splitGraphemes('Mäu')).toEqual(['M', 'äu']);
    expect(splitGraphemes('Qual')).toEqual(['Qu', 'a', 'l']);
    expect(splitGraphemes('cke')).toEqual(['ck', 'e']);
    expect(splitGraphemes('Tier')).toEqual(['T', 'ie', 'r']);
    expect(splitGraphemes('Tee')).toEqual(['T', 'e', 'e']);
  });
});

describe('parseWord', () => {
  it('splits at hyphens into syllables', () => {
    expect(parseWord('Son-ne')).toEqual([['S', 'o', 'n'], ['n', 'e']]);
    expect(parseWord('O-ma')).toEqual([['O'], ['m', 'a']]);
  });
});

describe('keyOf', () => {
  it('normalizes graphemes to keys', () => {
    expect(keyOf('Sch')).toBe('sch');
    expect(keyOf('ll')).toBe('l');
    expect(keyOf('Äu')).toBe('äu');
    expect(keyOf('ß')).toBe('ß');
  });
});

describe('isVowel', () => {
  it('detects vowel graphemes', () => {
    expect(isVowel('Ei')).toBe(true);
    expect(isVowel('Sch')).toBe(false);
    expect(isVowel('ll')).toBe(false);
  });
});
