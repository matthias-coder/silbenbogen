/** How one word went: good at the first try, good at try 2 or 3, or skipped after try 3. */
export type Outcome = 'first' | 'later' | 'skipped';

export interface ItemProgress {
  /** First-try reads in a row; a stumble pauses it, a skip resets it. 3 = learned. */
  streak: number;
  /** Difficulty 0 (sure) … 4 (hard); drives the selection weight. */
  level: number;
  /** In the album; never reset by later outcomes. */
  learned: boolean;
  /** Learned since the album was last opened. */
  fresh: boolean;
}

export interface Progress {
  version: 1;
  items: Record<string, ItemProgress>;
}

const LEARNED_STREAK = 3;
const START_LEVEL = 2;
const MAX_LEVEL = 4;
const UNKNOWN_WEIGHT = 3;
const LEVEL_WEIGHTS: readonly number[] = [1, 2, 3, 5, 8];

export const emptyProgress = (): Progress => ({ version: 1, items: {} });

export function recordOutcome(
  p: Progress,
  id: string,
  o: Outcome,
): { progress: Progress; learnedNow: boolean } {
  const prev = p.items[id] ?? { streak: 0, level: START_LEVEL, learned: false, fresh: false };
  const next = { ...prev };
  if (o === 'first') {
    next.streak = Math.min(LEARNED_STREAK, prev.streak + 1);
    next.level = Math.max(0, prev.level - 1);
  } else if (o === 'skipped') {
    next.streak = 0;
    next.level = Math.min(MAX_LEVEL, prev.level + 2);
  }
  const learnedNow = !prev.learned && next.streak >= LEARNED_STREAK;
  if (learnedNow) {
    next.learned = true;
    next.fresh = true;
  }
  return { progress: { version: 1, items: { ...p.items, [id]: next } }, learnedNow };
}

export function weightOf(p: Progress, id: string): number {
  const item = p.items[id];
  return item ? LEVEL_WEIGHTS[item.level] ?? UNKNOWN_WEIGHT : UNKNOWN_WEIGHT;
}

export function markAllSeen(p: Progress): Progress {
  const items: Record<string, ItemProgress> = {};
  for (const [id, item] of Object.entries(p.items)) items[id] = { ...item, fresh: false };
  return { version: 1, items };
}
