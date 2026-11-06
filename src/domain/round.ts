import type { Item, Stage } from './types';

const pick = <T>(list: readonly T[], rng: () => number): T =>
  list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

/**
 * Builds a round of `size` tasks. Each position first picks a stage uniformly among the
 * stages present in the pool, then a task of that stage not yet used this round; falls back to
 * any task of the stage, then any pool task, that is not the previous one.
 */
export function buildRound(pool: Item[], rng: () => number = Math.random, size = 10): Item[] {
  if (pool.length === 0) return [];
  const stages = [...new Set(pool.map((i) => i.stage))].sort() as Stage[];
  const round: Item[] = [];
  const used = new Set<string>();
  for (let n = 0; n < size; n++) {
    const prev = round[n - 1];
    const stage = pick(stages, rng);
    const stageItems = pool.filter((i) => i.stage === stage);
    const fresh = stageItems.filter((i) => !used.has(i.id));
    const notPrev = (list: Item[]) => list.filter((i) => i.id !== prev?.id);
    const candidates = [fresh, notPrev(stageItems), notPrev(pool)].find((l) => l.length > 0);
    const item = candidates ? pick(candidates, rng) : pool[0];
    round.push(item);
    used.add(item.id);
  }
  return round;
}
