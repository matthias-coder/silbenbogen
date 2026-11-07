import { GROUPS } from './graphemes';
import type { Stage } from './types';

export const STAGES: readonly Stage[] = [1, 2, 3, 4, 5, 6];

export const STAGE_LABELS: Record<Stage, string> = {
  1: 'Mitlaut + Selbstlaut (Ma, Se)',
  2: 'Selbstlaut + Mitlaut (Am, El)',
  3: 'Wörter aus Zweier-Silben (Ma-ma, Na-se)',
  4: 'Silben mit drei Lauten (Mut, Son-ne)',
  5: 'Buchstabengruppen (Schu-le, Ei-mer)',
  6: 'Mehrere Mitlaute (Blu-me, Brot)',
};

export const STAGE_TABS: Record<Stage, string> = {
  1: '1 Ma, Se',
  2: '2 Am, El',
  3: '3 Ma-ma',
  4: '4 Son-ne',
  5: '5 Schu-le',
  6: '6 Blu-me',
};

const REASON_SYLLABLES = 'Dafür braucht es mindestens einen Mitlaut und einen Selbstlaut.';
const REASON_GROUP = 'Dafür fehlt eine Buchstabengruppe (z. B. Sch, Ei, Au).';
const REASON_WORDS = 'Mit diesen Buchstaben gibt es dafür noch keine Wörter.';

export const unit = (stage: Stage): 'Silben' | 'Wörter' => (stage <= 2 ? 'Silben' : 'Wörter');

/** Why a stage has no tasks with the given letters. */
export function reasonFor(stage: Stage, known: ReadonlySet<string>): string {
  if (stage <= 2) return REASON_SYLLABLES;
  if (stage === 5 && !GROUPS.some((g) => known.has(g))) return REASON_GROUP;
  return REASON_WORDS;
}
