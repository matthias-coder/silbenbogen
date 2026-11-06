import { describe, expect, it } from 'vitest';
import { WORDS } from './wordlist';
import { GROUPS, LETTERS } from './graphemes';
import type { Item } from './types';

const byStage = (s: number) => WORDS.filter((w) => w.stage === s);
const knownOnly = (keys: string[]) => (w: Item) => w.keys.every((k) => keys.includes(k));
const EARLY = ['a', 'e', 'i', 'o', 'u', 'm', 'l', 's', 'n', 'f', 'r', 't'];
const DEFAULT = ['a', 'e', 'i', 'o', 'u', 'm', 'l', 's', 'n', 'f'];

describe('word list', () => {
  it('has unique ids and enough words per stage', () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
    for (const s of [3, 4, 5, 6]) expect(byStage(s).length).toBeGreaterThanOrEqual(40);
  });
  it('respects size and spelling limits', () => {
    for (const w of WORDS) {
      expect(w.syllables.length).toBeLessThanOrEqual(3);
      expect(w.syllables.flat().length).toBeLessThanOrEqual(9);
      expect(w.keys.every((k) => LETTERS.includes(k) || GROUPS.includes(k))).toBe(true);
      expect(w.text).not.toMatch(/ng|nk|aa|ee|oo|[aeiouäöü]h|y/i);
    }
  });
  it('offers enough words for early learners', () => {
    expect(byStage(3).every((w) => w.syllables.length >= 2)).toBe(true);
    expect(byStage(3).filter(knownOnly(DEFAULT)).length).toBeGreaterThanOrEqual(20);
    expect(byStage(3).filter(knownOnly(EARLY)).length).toBeGreaterThanOrEqual(25);
    expect(byStage(4).filter(knownOnly(EARLY)).length).toBeGreaterThanOrEqual(25);
    expect(byStage(6).filter(knownOnly(EARLY)).length).toBeGreaterThanOrEqual(25);
    expect(
      byStage(5).filter(knownOnly([...EARLY, 'sch', 'ch', 'ck', 'ei', 'au', 'eu', 'ie'])).length,
    ).toBeGreaterThanOrEqual(25);
  });
});
