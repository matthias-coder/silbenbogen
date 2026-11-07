import { GROUPS, LETTERS } from '../domain/graphemes';
import { countByStage } from '../domain/pool';
import type { Settings } from '../domain/types';

export const STORAGE_KEY = 'silbenbogen.settings.v2';
export const LEGACY_KEY = 'silbenbogen.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  version: 2,
  known: ['a', 'e', 'i', 'o', 'u', 'm', 'l', 's', 'n', 'f'],
  name: '',
};

const MAX_NAME = 20;
const VALID_KEYS: ReadonlySet<string> = new Set([...LETTERS, ...GROUPS]);

const defaults = (): Settings => ({ ...DEFAULT_SETTINGS, known: [...DEFAULT_SETTINGS.known] });

/** Trims, collapses inner whitespace and limits the child's name to 20 characters. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME).trim();
}

function read(storage: Pick<Storage, 'getItem'>, key: string): unknown {
  try {
    return JSON.parse(storage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

/**
 * Reads settings (v2, else migrates v1); any problem (blocked storage, broken JSON, bad shape,
 * no possible task) yields the defaults.
 */
export function loadSettings(storage?: Pick<Storage, 'getItem'>): Settings {
  let src: Pick<Storage, 'getItem'>;
  try {
    src = storage ?? localStorage;
  } catch {
    return defaults();
  }
  let data = read(src, STORAGE_KEY);
  let expected = 2;
  if (data === null) {
    data = read(src, LEGACY_KEY);
    expected = 1;
  }
  if (typeof data !== 'object' || data === null) return defaults();
  const { version, known, name } = data as Record<string, unknown>;
  if (version !== expected || !Array.isArray(known)) return defaults();

  const cleanKnown = [...new Set(known)].filter(
    (k): k is string => typeof k === 'string' && VALID_KEYS.has(k),
  );
  const counts = countByStage(new Set(cleanKnown));
  if (Object.values(counts).every((n) => n === 0)) return defaults();
  const cleanName = expected === 2 && typeof name === 'string' ? normalizeName(name) : '';
  return { version: 2, known: cleanKnown, name: cleanName };
}

/** Writes settings; storage errors (quota, blocked) are swallowed. */
export function saveSettings(s: Settings, storage?: Pick<Storage, 'setItem'>): void {
  try {
    (storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Persistence is best effort.
  }
}
