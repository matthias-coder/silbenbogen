import { GROUPS, isVowel, keyOf, parseWord } from './graphemes';
import type { Item, Syllable } from './types';

/** First matching rule wins: consonant cluster (6), grapheme group (5), long syllable (4), else 3. */
export function stageOfWord(syllables: Syllable[]): 3 | 4 | 5 | 6 {
  const hasCluster = syllables.some((syl) =>
    syl.some((g, i) => i > 0 && !isVowel(g) && !isVowel(syl[i - 1])),
  );
  if (hasCluster) return 6;
  if (syllables.some((syl) => syl.some((g) => GROUPS.includes(keyOf(g))))) return 5;
  if (syllables.some((syl) => syl.length >= 3)) return 4;
  return 3;
}

/** Builds a word item from hyphenated notation such as "Schu-le". */
export function makeWord(notation: string): Item {
  const syllables = parseWord(notation);
  const text = notation.replace(/-/g, '');
  const keys = [...new Set(syllables.flat().map(keyOf))];
  return {
    id: `wort-${text.toLowerCase()}`,
    kind: 'wort',
    text,
    syllables,
    stage: stageOfWord(syllables),
    keys,
  };
}
