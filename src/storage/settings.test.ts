import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  LEGACY_KEY,
  STORAGE_KEY,
  loadSettings,
  normalizeName,
  saveSettings,
} from './settings';

const mem = (data: Record<string, unknown>) => ({
  getItem: (k: string) => (k in data ? (typeof data[k] === 'string' ? (data[k] as string) : JSON.stringify(data[k])) : null),
});

describe('loadSettings', () => {
  it('uses the v2 key', () => {
    expect(STORAGE_KEY).toBe('silbenbogen.settings.v2');
    expect(LEGACY_KEY).toBe('silbenbogen.settings.v1');
  });

  it('reads v2 data', () => {
    expect(
      loadSettings(mem({ [STORAGE_KEY]: { version: 2, known: ['a', 'm'], name: ' Lena ' } })),
    ).toEqual({ version: 2, known: ['a', 'm'], name: 'Lena' });
  });

  it('migrates v1 data', () => {
    expect(
      loadSettings(mem({ [LEGACY_KEY]: { version: 1, known: ['a', 'm', 'r'], stages: [1, 3] } })),
    ).toEqual({ version: 2, known: ['a', 'm', 'r'], name: '' });
  });

  it('prefers v2 over v1', () => {
    expect(
      loadSettings(
        mem({
          [STORAGE_KEY]: { version: 2, known: ['a', 'l'], name: 'Max' },
          [LEGACY_KEY]: { version: 1, known: ['a', 'm'], stages: [1] },
        }),
      ),
    ).toEqual({ version: 2, known: ['a', 'l'], name: 'Max' });
  });

  it('falls back to defaults on missing, broken or malformed data', () => {
    expect(loadSettings(mem({}))).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(mem({ [STORAGE_KEY]: '{kaputt' }))).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(mem({ [STORAGE_KEY]: { version: 2, known: 'x', name: '' } }))).toEqual(
      DEFAULT_SETTINGS,
    );
    expect(
      loadSettings({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('drops unknown keys and treats a non-string name as empty', () => {
    expect(
      loadSettings(mem({ [STORAGE_KEY]: { version: 2, known: ['m', 'a', '€', 'sch', 'M'], name: 5 } })),
    ).toEqual({ version: 2, known: ['m', 'a', 'sch'], name: '' });
  });

  it('falls back to defaults when no stage has tasks', () => {
    expect(loadSettings(mem({ [STORAGE_KEY]: { version: 2, known: ['m'], name: 'X' } }))).toEqual(
      DEFAULT_SETTINGS,
    );
  });
});

describe('normalizeName', () => {
  it('trims, collapses whitespace and limits to 20 characters', () => {
    expect(normalizeName('  Anna   Lena  ')).toBe('Anna Lena');
    expect(normalizeName('a'.repeat(30))).toBe('a'.repeat(20));
  });
});

describe('saveSettings', () => {
  it('round-trips and swallows storage errors', () => {
    const store: Record<string, string> = {};
    saveSettings(
      { version: 2, known: ['a', 'm'], name: 'Lena' },
      {
        setItem: (k, v) => {
          store[k] = v;
        },
      },
    );
    expect(Object.keys(store)).toEqual([STORAGE_KEY]);
    expect(loadSettings({ getItem: (k) => store[k] ?? null })).toEqual({
      version: 2,
      known: ['a', 'm'],
      name: 'Lena',
    });
    expect(() =>
      saveSettings(DEFAULT_SETTINGS, {
        setItem: () => {
          throw new Error('quota');
        },
      }),
    ).not.toThrow();
  });
});
