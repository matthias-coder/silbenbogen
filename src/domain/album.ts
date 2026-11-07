import { GROUPS, LETTERS } from './graphemes';
import { itemsForStage } from './pool';
import type { Progress } from './progress';
import { STAGES } from './stageInfo';
import type { Stage } from './types';

export interface Card {
  id: string;
  text: string;
  learned: boolean;
  fresh: boolean;
}

export interface AlbumPage {
  stage: Stage;
  cards: Card[];
  learned: number;
}

const ALL_KEYS: ReadonlySet<string> = new Set([...LETTERS, ...GROUPS]);

/**
 * One page per stage with cards: every currently possible task (empty slot until learned) plus
 * learned tasks of that stage that still exist but are no longer possible.
 */
export function albumPages(known: ReadonlySet<string>, p: Progress): AlbumPage[] {
  const pages: AlbumPage[] = [];
  for (const stage of STAGES) {
    const possible = new Set(itemsForStage(stage, known).map((i) => i.id));
    const cards = itemsForStage(stage, ALL_KEYS)
      .filter((i) => possible.has(i.id) || p.items[i.id]?.learned)
      .map((i) => ({
        id: i.id,
        text: i.text,
        learned: p.items[i.id]?.learned ?? false,
        fresh: p.items[i.id]?.fresh ?? false,
      }))
      .sort((a, b) => a.text.localeCompare(b.text, 'de'));
    if (cards.length > 0) {
      pages.push({ stage, cards, learned: cards.filter((c) => c.learned).length });
    }
  }
  return pages;
}

/** Learned and total among the currently possible tasks of a stage. */
export function stageProgress(
  stage: Stage,
  known: ReadonlySet<string>,
  p: Progress,
): { learned: number; total: number; practised: boolean } {
  const items = itemsForStage(stage, known);
  return {
    learned: items.filter((i) => p.items[i.id]?.learned).length,
    total: items.length,
    practised: items.some((i) => i.id in p.items),
  };
}
