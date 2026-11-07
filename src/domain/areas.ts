import type { Stage } from './types';

/** A practice area the child can pick on the start menu. */
export interface Area {
  id: string;
  title: string;
  example: string;
  stages: Stage[];
}

export const AREAS: readonly Area[] = [
  { id: 'silben', title: 'Silben', example: 'Ma · Am', stages: [1, 2] },
  { id: 'kurz', title: 'Kurze Wörter', example: 'Mama', stages: [3] },
  { id: 'lang', title: 'Lange Silben', example: 'Sonne', stages: [4] },
  { id: 'gruppen', title: 'Buchstabengruppen', example: 'Schule', stages: [5] },
  { id: 'mitlaute', title: 'Viele Mitlaute', example: 'Blume', stages: [6] },
];

export const MIXED_ID = 'alle';

/**
 * Areas reachable with the enabled stages, each limited to its enabled stages.
 * "Alles gemischt" is added when more than one area is available.
 */
export function availableAreas(enabled: readonly Stage[]): Area[] {
  const areas = AREAS.map((a) => ({ ...a, stages: a.stages.filter((s) => enabled.includes(s)) }))
    .filter((a) => a.stages.length > 0);
  if (areas.length > 1) {
    areas.push({
      id: MIXED_ID,
      title: 'Alles gemischt',
      example: '',
      stages: areas.flatMap((a) => a.stages),
    });
  }
  return areas;
}
