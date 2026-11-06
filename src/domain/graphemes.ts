import type { Grapheme, Syllable } from './types';

export const VOWELS: readonly string[] = ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü'];
export const VOWEL_GROUPS: readonly string[] = ['ei', 'au', 'eu', 'äu', 'ie'];
export const GROUPS: readonly string[] = ['sch', 'ch', 'ck', 'ei', 'au', 'eu', 'äu', 'ie', 'qu'];
export const LETTERS: readonly string[] = [
  ...'abcdefghijklmnopqrstuvwxyz',
  'ä',
  'ö',
  'ü',
  'ß',
];

/** Splits a syllable greedily from the left: sch, other groups, doubled consonant, single letter. */
export function splitGraphemes(syllable: string): Grapheme[] {
  const lower = syllable.toLowerCase();
  const result: Grapheme[] = [];
  let i = 0;
  while (i < syllable.length) {
    let len = 1;
    if (lower.startsWith('sch', i)) {
      len = 3;
    } else {
      const group = GROUPS.find((g) => g !== 'sch' && lower.startsWith(g, i));
      if (group) {
        len = group.length;
      } else if (
        i + 1 < lower.length &&
        lower[i] === lower[i + 1] &&
        !VOWELS.includes(lower[i])
      ) {
        len = 2;
      }
    }
    result.push(syllable.slice(i, i + len));
    i += len;
  }
  return result;
}

/** Parses hyphenated notation such as "Schu-le" into syllables of graphemes. */
export function parseWord(notation: string): Syllable[] {
  return notation.split('-').map(splitGraphemes);
}

/** Normalized key: lower case, doubled consonant collapsed to a single letter. */
export function keyOf(g: Grapheme): string {
  const lower = g.toLowerCase();
  if (lower.length === 2 && lower[0] === lower[1] && !VOWELS.includes(lower[0])) {
    return lower[0];
  }
  return lower;
}

export function isVowel(g: Grapheme): boolean {
  const key = keyOf(g);
  return VOWELS.includes(key) || VOWEL_GROUPS.includes(key);
}
