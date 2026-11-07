import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { countByStage } from '../domain/pool';
import type { Settings } from '../domain/types';
import { DEFAULT_SETTINGS } from '../storage/settings';
import { mountParentScreen } from './parentScreen';

describe('mountParentScreen', () => {
  let root: HTMLElement;
  let onDone: Mock<(s: Settings) => void>;
  let onCancel: Mock<() => void>;
  let onResetProgress: Mock<() => void>;
  let confirm: Mock<(msg: string) => boolean>;
  let unmount: () => void;
  const key = (k: string) => root.querySelector(`button[data-key="${k}"]`) as HTMLButtonElement;
  const q = (id: string) => root.querySelector(`[data-testid="${id}"]`) as HTMLElement;
  const done = () => q('done') as HTMLButtonElement;
  const nameInput = () => q('name') as HTMLInputElement;
  const vowels = ['a', 'e', 'i', 'o', 'u'];

  const mount = (settings: Settings = DEFAULT_SETTINGS) => {
    unmount?.();
    unmount = mountParentScreen(root, { settings, onDone, onCancel, onResetProgress, confirm });
  };

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    onDone = vi.fn();
    onCancel = vi.fn();
    onResetProgress = vi.fn();
    confirm = vi.fn(() => true);
    mount();
  });
  afterEach(() => {
    unmount();
    root.remove();
  });

  it('shows the known letters with labels', () => {
    expect(key('m').getAttribute('aria-pressed')).toBe('true');
    expect(key('r').getAttribute('aria-pressed')).toBe('false');
    expect(key('a').textContent).toBe('A');
    expect(key('ß').textContent).toBe('ß');
    expect(key('sch').textContent).toBe('Sch');
    expect(key('äu').textContent).toBe('Äu');
  });

  it('has no stage checkboxes and the new headings', () => {
    expect(root.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    expect(root.querySelector('h1')!.textContent).toBe('Elternbereich');
    expect([...root.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([
      'Name des Kindes',
      'Bekannte Buchstaben',
    ]);
  });

  it('prefills the name and reports it normalised with the letters', () => {
    mount({ ...DEFAULT_SETTINGS, name: 'Lena' });
    expect(nameInput().value).toBe('Lena');
    expect(nameInput().maxLength).toBe(20);
    expect(nameInput().placeholder).toBe('optional');
    nameInput().value = '  Anna   Lena ';
    key('r').click();
    done().click();
    expect(onDone).toHaveBeenCalledWith({
      version: 2,
      known: expect.arrayContaining([...DEFAULT_SETTINGS.known, 'r']),
      name: 'Anna Lena',
    });
    expect(onDone.mock.calls[0][0].known).toHaveLength(DEFAULT_SETTINGS.known.length + 1);
  });

  it('summarises all stages that have tasks', () => {
    const c = countByStage(new Set(DEFAULT_SETTINGS.known));
    const words = c[3] + c[4] + c[5] + c[6];
    expect(q('summary').textContent).toBe(`So wird geübt: ${c[1] + c[2]} Silben und ${words} Wörter`);
  });

  it('blocks saving when no stage has tasks', () => {
    expect(q('empty-hint').hidden).toBe(true);
    for (const v of vowels) key(v).click();
    expect(q('empty-hint').hidden).toBe(false);
    expect(q('empty-hint').textContent).toBe('Mit diesen Buchstaben gibt es keine Aufgaben. Bitte Buchstaben ergänzen.');
    expect(q('summary').hidden).toBe(true);
    expect(done().disabled).toBe(true);
    key('a').click();
    expect(done().disabled).toBe(false);
  });

  it('resets progress only after confirmation', () => {
    expect(q('reset-progress').textContent).toBe('Fortschritt zurücksetzen');
    confirm.mockReturnValueOnce(false);
    q('reset-progress').click();
    expect(confirm).toHaveBeenCalledWith('Lernstand und Album wirklich löschen? Name und Buchstaben bleiben.');
    expect(onResetProgress).not.toHaveBeenCalled();
    expect(q('reset-done')).toBeNull();
    q('reset-progress').click();
    expect(onResetProgress).toHaveBeenCalledOnce();
    expect(q('reset-done').textContent).toBe('Fortschritt gelöscht');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', () => {
    key('r').click();
    q('cancel').click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
  });
});
