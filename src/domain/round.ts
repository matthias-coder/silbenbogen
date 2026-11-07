import type { Item, Stage } from './types';

const pick = <T>(list: readonly T[], rng: () => number): T =>
  list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

/** Picks by cumulative weight with one rng() call; non-positive weights count as tiny. */
function pickWeighted(list: readonly Item[], rng: () => number, weight: (i: Item) => number): Item {
  const ws = list.map((i) => Math.max(weight(i), 1e-6));
  let r = rng() * ws.reduce((a, b) => a + b, 0);
  for (let k = 0; k < list.length; k++) {
    r -= ws[k];
    if (r < 0) return list[k];
  }
  return list[list.length - 1];
}

/**
 * Builds a round of `size` tasks. Each position picks a stage uniformly among the stages that
 * still have a task not yet used this round, then a random unused task of that stage. If every
 * task was used (pool smaller than the round): any pool task that is not the previous one;
 * with a pool of one: the only task. Within a stage (and in the fallback) tasks are picked by
 * `weight`; the stage itself is still chosen uniformly.
 */
export function buildRound(
  pool: Item[],
  rng: () => number = Math.random,
  size = 10,
  weight: (item: Item) => number = () => 1,
): Item[] {
  if (pool.length === 0) return [];
  const round: Item[] = [];
  const used = new Set<string>();
  for (let n = 0; n < size; n++) {
    const prev = round[n - 1];
    const fresh = pool.filter((i) => !used.has(i.id));
    let item: Item;
    if (fresh.length > 0) {
      const stages = [...new Set(fresh.map((i) => i.stage))].sort() as Stage[];
      const stage = pick(stages, rng);
      item = pickWeighted(fresh.filter((i) => i.stage === stage), rng, weight);
    } else {
      const notPrev = pool.filter((i) => i.id !== prev?.id);
      item = notPrev.length > 0 ? pickWeighted(notPrev, rng, weight) : pool[0];
    }
    round.push(item);
    used.add(item.id);
  }
  return round;
}
