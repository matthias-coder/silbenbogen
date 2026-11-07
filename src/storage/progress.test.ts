import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../domain/progress';
import { clearProgress, loadProgress, progressKey, saveProgress } from './progress';

const memory = () => {
  const store: Record<string, string> = {};
  return {
    store,
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
};
const throwing = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('progress storage', () => {
  it('uses a per-profile key', () => {
    expect(progressKey()).toBe('silbenbogen.progress.v1.default');
    expect(progressKey('max')).toBe('silbenbogen.progress.v1.max');
  });

  it('falls back to empty progress on missing, broken, wrong or blocked data', () => {
    const m = memory();
    expect(loadProgress(m)).toEqual(emptyProgress());
    m.store[progressKey()] = '{kaputt';
    expect(loadProgress(m)).toEqual(emptyProgress());
    m.store[progressKey()] = JSON.stringify({ version: 9, items: {} });
    expect(loadProgress(m)).toEqual(emptyProgress());
    m.store[progressKey()] = JSON.stringify({ version: 1, items: [] });
    expect(loadProgress(m)).toEqual(emptyProgress());
    expect(loadProgress(throwing)).toEqual(emptyProgress());
  });

  it('drops malformed entries and keeps valid ones', () => {
    const m = memory();
    const ok = { streak: 2, level: 1, learned: false, fresh: false };
    m.store[progressKey()] = JSON.stringify({
      version: 1,
      items: { 'wort-mama': ok, 'wort-nase': { streak: 'x', level: 1, learned: false, fresh: false }, 'wort-oma': null },
    });
    expect(loadProgress(m)).toEqual({ version: 1, items: { 'wort-mama': ok } });
  });

  it('round-trips, clears and swallows errors', () => {
    const m = memory();
    const p = { version: 1 as const, items: { 'wort-mama': { streak: 3, level: 0, learned: true, fresh: true } } };
    saveProgress(p, m);
    expect(loadProgress(m)).toEqual(p);
    clearProgress(m);
    expect(m.store).toEqual({});
    expect(() => saveProgress(p, throwing)).not.toThrow();
    expect(() => clearProgress(throwing)).not.toThrow();
  });
});
