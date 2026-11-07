import { describe, expect, it } from 'vitest';
import { albumPages, stageProgress } from './album';
import { itemsForStage } from './pool';
import { emptyProgress, recordOutcome, type Progress } from './progress';
import { STAGE_TABS, reasonFor, unit } from './stageInfo';

const learn = (p: Progress, id: string): Progress => {
  for (let n = 0; n < 3; n++) p = recordOutcome(p, id, 'first').progress;
  return p;
};
const BASE = ['a', 'e', 'i', 'o', 'u', 'm', 'l', 's', 'n', 'f'];
const page = (pages: ReturnType<typeof albumPages>, stage: number) => pages.find((x) => x.stage === stage);

describe('albumPages', () => {
  it('shows possible items as empty slots until learned', () => {
    const known = new Set(BASE);
    const pages = albumPages(known, learn(emptyProgress(), 'silbe-ma'));
    const p1 = page(pages, 1)!;
    expect(p1.cards).toHaveLength(itemsForStage(1, known).length);
    expect(p1.learned).toBe(1);
    expect(p1.cards.find((c) => c.id === 'silbe-ma')).toMatchObject({ learned: true, fresh: true, text: 'Ma' });
    expect(p1.cards.filter((c) => !c.learned)).toHaveLength(p1.cards.length - 1);
  });

  it('keeps a learned card after its letter is removed', () => {
    const p = learn(emptyProgress(), 'wort-rose');
    const pages = albumPages(new Set(BASE), p);
    expect(page(pages, 3)!.cards.some((c) => c.id === 'wort-rose' && c.learned)).toBe(true);
    const sp = stageProgress(3, new Set(BASE), p);
    expect(sp.total).toBe(itemsForStage(3, new Set(BASE)).length);
    expect(sp.learned).toBe(0);
  });

  it('ignores ids that are not in the word list', () => {
    const pages = albumPages(new Set(BASE), learn(emptyProgress(), 'wort-gibtsnicht'));
    expect(pages.flatMap((x) => x.cards).some((c) => c.id === 'wort-gibtsnicht')).toBe(false);
  });

  it('has pages only for stages with cards, sorted alphabetically', () => {
    const pages = albumPages(new Set(BASE), emptyProgress());
    expect(pages.map((x) => x.stage)).not.toContain(5);
    for (const pg of pages) {
      const texts = pg.cards.map((c) => c.text);
      expect(texts).toEqual([...texts].sort((a, b) => a.localeCompare(b, 'de')));
    }
  });
});

describe('stageProgress', () => {
  it('counts learned items among the possible ones', () => {
    const known = new Set(BASE);
    expect(stageProgress(1, known, emptyProgress())).toEqual({ learned: 0, total: 25, practised: false });
    const once = recordOutcome(emptyProgress(), 'silbe-ma', 'later').progress;
    expect(stageProgress(1, known, once)).toEqual({ learned: 0, total: 25, practised: true });
    expect(stageProgress(1, known, learn(emptyProgress(), 'silbe-ma')).learned).toBe(1);
  });
});

describe('stageInfo', () => {
  it('has tabs, units and reasons', () => {
    expect(STAGE_TABS).toEqual({ 1: '1 Ma, Se', 2: '2 Am, El', 3: '3 Ma-ma', 4: '4 Son-ne', 5: '5 Schu-le', 6: '6 Blu-me' });
    expect(unit(2)).toBe('Silben');
    expect(unit(3)).toBe('Wörter');
    expect(reasonFor(5, new Set(BASE))).toBe('Dafür fehlt eine Buchstabengruppe (z. B. Sch, Ei, Au).');
    expect(reasonFor(1, new Set(['m']))).toBe('Dafür braucht es mindestens einen Mitlaut und einen Selbstlaut.');
    expect(reasonFor(5, new Set(['sch']))).toBe('Mit diesen Buchstaben gibt es dafür noch keine Wörter.');
  });
});
