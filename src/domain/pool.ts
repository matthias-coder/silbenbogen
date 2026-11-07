import { VOWELS } from './graphemes';
import { WORDS } from './wordlist';
import type { Item, Stage } from './types';

export const ONSET: readonly string[] = [...'bdfghjklmnprstwz'];
export const CODA: readonly string[] = [...'fklmnprst'];
export const BLOCKED_SYLLABLES: ReadonlySet<string> = new Set(['po', 'pi']);

const STAGES: readonly Stage[] = [1, 2, 3, 4, 5, 6];

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function syllableItem(first: string, second: string, stage: 1 | 2): Item {
  const lower = first + second;
  const a = capitalize(first);
  const b = second;
  return {
    id: `silbe-${lower}`,
    kind: 'silbe',
    text: a + b,
    syllables: [[a, b]],
    stage,
    keys: [...new Set([first, second])],
  };
}

/** Random-syllable tasks: stage 1 = consonant + vowel, stage 2 = vowel + consonant. */
export function randomSyllables(stage: 1 | 2, known: ReadonlySet<string>): Item[] {
  const vowels = VOWELS.filter((v) => known.has(v));
  const [firsts, seconds] =
    stage === 1
      ? [ONSET.filter((c) => known.has(c)), vowels]
      : [vowels, CODA.filter((c) => known.has(c))];
  const items: Item[] = [];
  for (const first of firsts) {
    for (const second of seconds) {
      if (BLOCKED_SYLLABLES.has(first + second)) continue;
      items.push(syllableItem(first, second, stage));
    }
  }
  return items;
}

export function itemsForStage(stage: Stage, known: ReadonlySet<string>): Item[] {
  if (stage === 1 || stage === 2) return randomSyllables(stage, known);
  return WORDS.filter((w) => w.stage === stage && w.keys.every((k) => known.has(k)));
}

export function countByStage(known: ReadonlySet<string>): Record<Stage, number> {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<Stage, number>;
  for (const stage of STAGES) counts[stage] = itemsForStage(stage, known).length;
  return counts;
}

export function buildPool(known: ReadonlySet<string>, stages: readonly Stage[]): Item[] {
  return stages.flatMap((stage) => itemsForStage(stage, known));
}

/** Drops stages that have no possible tasks. */
export function reconcileStages(stages: Stage[], counts: Record<Stage, number>): Stage[] {
  return stages.filter((s) => counts[s] > 0);
}
