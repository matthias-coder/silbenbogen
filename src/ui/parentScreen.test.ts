import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { Settings } from '../domain/types';
import { DEFAULT_SETTINGS } from '../storage/settings';
import { mountParentScreen } from './parentScreen';

describe('mountParentScreen', () => {
  let root: HTMLElement;
  let onDone: Mock<(s: Settings) => void>;
  let onCancel: Mock<() => void>;
  let unmount: () => void;
  const key = (k: string) => root.querySelector(`button[data-key="${k}"]`) as HTMLButtonElement;
  const stage = (n: number) => root.querySelector(`input[data-stage="${n}"]`) as HTMLInputElement;
  const count = (n: number) => root.querySelector(`[data-count="${n}"]`)!.textContent;
  const done = () => root.querySelector('[data-testid="done"]') as HTMLButtonElement;
  const summary = () => root.querySelector('[data-testid="summary"]')!.textContent;
  const reason = (n: number) => root.querySelector(`[data-reason="${n}"]`) as HTMLElement;
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const hint = () => root.querySelector('[data-testid="empty-hint"]') as HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    onDone = vi.fn();
    onCancel = vi.fn();
    unmount = mountParentScreen(root, { settings: DEFAULT_SETTINGS, onDone, onCancel });
  });
  afterEach(() => {
    unmount();
    root.remove();
  });

  it('shows the initial selection, labels and counts', () => {
    expect(key('m').getAttribute('aria-pressed')).toBe('true');
    expect(key('r').getAttribute('aria-pressed')).toBe('false');
    expect(key('a').textContent).toBe('A');
    expect(key('ß').textContent).toBe('ß');
    expect(key('sch').textContent).toBe('Sch');
    expect(key('äu').textContent).toBe('Äu');
    expect(stage(1).checked).toBe(true);
    expect(count(1)).toBe('25 Silben');
    expect(stage(5).disabled).toBe(true);
    expect(count(5)).toBe('0 Wörter');
    expect(hint().hidden).toBe(true);
    expect(root.textContent).toContain('Bekannte Buchstaben');
    expect(root.textContent).toContain('Was wird geübt');
  });

  it('reacts to selection changes and reports the result via onDone', () => {
    key('r').click();
    expect(count(1)).toBe('30 Silben');

    stage(1).click();
    expect(hint().hidden).toBe(false);
    expect(done().disabled).toBe(true);
    stage(3).click();
    expect(done().disabled).toBe(false);

    for (const v of ['a', 'e', 'i', 'o', 'u']) key(v).click();
    expect(stage(3).checked).toBe(false);
    expect(stage(3).disabled).toBe(true);
    expect(done().disabled).toBe(true);

    key('a').click();
    stage(1).click();
    done().click();
    expect(onDone).toHaveBeenCalledWith({
      version: 1,
      known: expect.arrayContaining(['a', 'm', 'l', 's', 'n', 'f', 'r']),
      stages: [1, 3],
    });
    expect(onDone.mock.calls[0][0].known).toHaveLength(7);
  });

  it('has a page title and two section headings', () => {
    expect(root.querySelector('h1')!.textContent).toBe('Elternbereich');
    expect([...root.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([
      'Bekannte Buchstaben',
      'Was wird geübt',
    ]);
  });

  it('summarises what is practised', () => {
    expect(summary()).toBe('So wird geübt: 25 Silben');
    stage(3).click();
    expect(summary()).toBe('So wird geübt: 25 Silben und 30 Wörter');
    stage(1).click();
    expect(summary()).toBe('So wird geübt: 30 Wörter');
  });

  it('explains why a stage is disabled', () => {
    expect(reason(1).hidden).toBe(true);
    expect(reason(5).hidden).toBe(false);
    expect(reason(5).textContent).toBe('Dafür fehlt eine Buchstabengruppe (z. B. Sch, Ei, Au).');
    for (const v of vowels) key(v).click();
    expect(reason(1).textContent).toBe('Dafür braucht es mindestens einen Mitlaut und einen Selbstlaut.');
    expect(reason(2).textContent).toBe('Dafür braucht es mindestens einen Mitlaut und einen Selbstlaut.');
    expect(reason(3).textContent).toBe('Mit diesen Buchstaben gibt es dafür noch keine Wörter.');
  });

  it('uses the generic words reason for stage 5 once a group is selected but no words exist', () => {
    key('sch').click();
    expect(reason(5).hidden).toBe(true);
    for (const v of vowels) key(v).click();
    expect(count(5)).toBe('0 Wörter');
    expect(reason(5).textContent).toBe('Mit diesen Buchstaben gibt es dafür noch keine Wörter.');
  });

  it('remembers wanted stages while letters are toggled', () => {
    stage(3).click();
    for (const v of vowels) key(v).click();
    expect(stage(3).checked).toBe(false);
    expect(stage(3).disabled).toBe(true);
    expect(done().disabled).toBe(true);
    expect(hint().hidden).toBe(false);
    expect(summary()).toBe('');
    key('a').click();
    expect(stage(3).disabled).toBe(false);
    expect(stage(3).checked).toBe(true);
    expect(stage(1).checked).toBe(true);
    expect(hint().hidden).toBe(true);
    done().click();
    expect(onDone.mock.calls[0][0].stages).toEqual([1, 3]);
  });

  it('cancels without saving', () => {
    stage(3).click();
    (root.querySelector('[data-testid="cancel"]') as HTMLButtonElement).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
  });
});
