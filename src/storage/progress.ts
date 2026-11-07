import { emptyProgress, type ItemProgress, type Progress } from '../domain/progress';

/** One key per profile, so more profiles can be added later. */
export const progressKey = (profile = 'default'): string => `silbenbogen.progress.v1.${profile}`;

const isCount = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;

function cleanItem(v: unknown): ItemProgress | null {
  if (typeof v !== 'object' || v === null) return null;
  const { streak, level, learned, fresh } = v as Record<string, unknown>;
  if (!isCount(streak, 3) || !isCount(level, 4)) return null;
  if (typeof learned !== 'boolean' || typeof fresh !== 'boolean') return null;
  return { streak, level, learned, fresh };
}

/** Reads progress; any problem yields empty progress, broken entries are dropped. */
export function loadProgress(storage?: Pick<Storage, 'getItem'>, profile?: string): Progress {
  let data: unknown;
  try {
    data = JSON.parse((storage ?? localStorage).getItem(progressKey(profile)) ?? 'null');
  } catch {
    return emptyProgress();
  }
  if (typeof data !== 'object' || data === null) return emptyProgress();
  const { version, items } = data as Record<string, unknown>;
  if (version !== 1 || typeof items !== 'object' || items === null || Array.isArray(items)) {
    return emptyProgress();
  }
  const clean: Record<string, ItemProgress> = {};
  for (const [id, raw] of Object.entries(items)) {
    const item = cleanItem(raw);
    if (item) clean[id] = item;
  }
  return { version: 1, items: clean };
}

/** Writes progress; storage errors are swallowed. */
export function saveProgress(p: Progress, storage?: Pick<Storage, 'setItem'>, profile?: string): void {
  try {
    (storage ?? localStorage).setItem(progressKey(profile), JSON.stringify(p));
  } catch {
    // Persistence is best effort.
  }
}

export function clearProgress(storage?: Pick<Storage, 'removeItem'>, profile?: string): void {
  try {
    (storage ?? localStorage).removeItem(progressKey(profile));
  } catch {
    // Persistence is best effort.
  }
}
