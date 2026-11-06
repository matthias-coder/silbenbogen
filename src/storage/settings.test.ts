import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings';

const mem = (v: string | null) => ({ getItem: () => v });

describe('loadSettings', () => {
  it('falls back to defaults on missing, broken or malformed data', () => {
    expect(loadSettings(mem(null))).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(mem('{kaputt'))).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(mem('{"version":1,"known":"x","stages":[1]}'))).toEqual(DEFAULT_SETTINGS);
    expect(
      loadSettings({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('drops unknown keys and cleans and sorts stages', () => {
    expect(
      loadSettings(
        mem(JSON.stringify({ version: 1, known: ['m', 'a', '€', 'sch', 'M'], stages: [3, 1, 1, 9] })),
      ),
    ).toEqual({ version: 1, known: ['m', 'a', 'sch'], stages: [1, 3] });
  });

  it('removes stages without possible tasks', () => {
    expect(
      loadSettings(mem(JSON.stringify({ version: 1, known: ['m', 'a'], stages: [1, 5] }))).stages,
    ).toEqual([1]);
  });

  it('falls back to defaults when no task is possible', () => {
    expect(loadSettings(mem(JSON.stringify({ version: 1, known: ['x'], stages: [1] })))).toEqual(
      DEFAULT_SETTINGS,
    );
  });
});

describe('saveSettings', () => {
  it('round-trips and swallows storage errors', () => {
    const store: Record<string, string> = {};
    saveSettings(
      { version: 1, known: ['a', 'm'], stages: [1] },
      {
        setItem: (k, v) => {
          store[k] = v;
        },
      },
    );
    expect(loadSettings({ getItem: (k) => store[k] ?? null })).toEqual({
      version: 1,
      known: ['a', 'm'],
      stages: [1],
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
