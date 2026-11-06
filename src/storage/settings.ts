import { GROUPS, LETTERS } from '../domain/graphemes';
import { countByStage, reconcileStages } from '../domain/pool';
import type { Settings, Stage } from '../domain/types';

export const STORAGE_KEY = 'silbenbogen.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  known: ['a', 'e', 'i', 'o', 'u', 'm', 'l', 's', 'n', 'f'],
  stages: [1],
};

const VALID_KEYS: ReadonlySet<string> = new Set([...LETTERS, ...GROUPS]);
const VALID_STAGES: readonly Stage[] = [1, 2, 3, 4, 5, 6];

const defaults = (): Settings => ({
  version: 1,
  known: [...DEFAULT_SETTINGS.known],
  stages: [...DEFAULT_SETTINGS.stages],
});

/** Reads settings; any problem (blocked storage, broken JSON, bad shape) yields the defaults. */
export function loadSettings(storage?: Pick<Storage, 'getItem'>): Settings {
  let data: unknown;
  try {
    data = JSON.parse((storage ?? localStorage).getItem(STORAGE_KEY) ?? 'null');
  } catch {
    return defaults();
  }
  if (typeof data !== 'object' || data === null) return defaults();
  const { version, known, stages } = data as Record<string, unknown>;
  if (version !== 1 || !Array.isArray(known) || !Array.isArray(stages)) return defaults();

  const cleanKnown = [...new Set(known)].filter(
    (k): k is string => typeof k === 'string' && VALID_KEYS.has(k),
  );
  const cleanStages = VALID_STAGES.filter((s) => stages.includes(s));
  const finalStages = reconcileStages(cleanStages, countByStage(new Set(cleanKnown)));
  if (finalStages.length === 0) return defaults();
  return { version: 1, known: cleanKnown, stages: finalStages };
}

/** Writes settings; storage errors (quota, blocked) are swallowed. */
export function saveSettings(s: Settings, storage?: Pick<Storage, 'setItem'>): void {
  try {
    (storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Persistence is best effort.
  }
}
