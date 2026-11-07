import { GROUPS, LETTERS } from '../domain/graphemes';
import { STAGES } from '../domain/stageInfo';
import { countByStage } from '../domain/pool';
import type { Settings, Stage } from '../domain/types';
import { normalizeName } from '../storage/settings';

/** "25 Silben und 30 Wörter" for the given stages; empty when nothing is practised. */
export function practiceParts(counts: Record<Stage, number>, stages: Iterable<Stage>): string {
  let syllables = 0;
  let words = 0;
  for (const s of stages) {
    if (s <= 2) syllables += counts[s];
    else words += counts[s];
  }
  const parts: string[] = [];
  if (syllables > 0) parts.push(`${syllables} Silben`);
  if (words > 0) parts.push(`${words} Wörter`);
  return parts.join(' und ');
}

const label = (key: string): string =>
  key === 'ß' ? key : key.charAt(0).toUpperCase() + key.slice(1);

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

export function mountParentScreen(
  root: HTMLElement,
  deps: {
    settings: Settings;
    onDone: (s: Settings) => void;
    onCancel: () => void;
    onResetProgress: () => void;
    confirm?: (msg: string) => boolean;
  },
): () => void {
  const known = new Set(deps.settings.known);
  const ask = deps.confirm ?? ((msg: string) => window.confirm(msg));

  const screen = el('div', 'parent');
  const body = el('div', 'parent-body');
  screen.appendChild(body);
  body.appendChild(el('h1', 'parent-page-title', 'Elternbereich'));

  body.appendChild(el('h2', 'parent-title', 'Name des Kindes'));
  const name = el('input', 'name-input');
  name.type = 'text';
  name.maxLength = 20;
  name.placeholder = 'optional';
  name.autocomplete = 'off';
  name.value = deps.settings.name;
  name.dataset.testid = 'name';
  name.setAttribute('aria-label', 'Name des Kindes');
  body.appendChild(name);

  body.appendChild(el('h2', 'parent-title', 'Bekannte Buchstaben'));
  const buttons = new Map<string, HTMLButtonElement>();
  const addGrid = (keys: readonly string[], className: string) => {
    const grid = el('div', `letter-grid ${className}`);
    for (const k of keys) {
      const b = el('button', 'letter', label(k));
      b.type = 'button';
      b.dataset.key = k;
      b.addEventListener('click', () => {
        if (known.has(k)) known.delete(k);
        else known.add(k);
        refresh();
      });
      buttons.set(k, b);
      grid.appendChild(b);
    }
    body.appendChild(grid);
  };
  addGrid(LETTERS, 'singles');
  addGrid(GROUPS, 'groups');

  const resetRow = el('div', 'reset-row');
  const reset = el('button', 'reset-progress', 'Fortschritt zurücksetzen');
  reset.type = 'button';
  reset.dataset.testid = 'reset-progress';
  reset.addEventListener('click', () => {
    if (!ask('Lernstand und Album wirklich löschen? Name und Buchstaben bleiben.')) return;
    deps.onResetProgress();
    if (!resetRow.querySelector('[data-testid="reset-done"]')) {
      const note = el('span', 'reset-done', 'Fortschritt gelöscht');
      note.dataset.testid = 'reset-done';
      resetRow.appendChild(note);
    }
  });
  resetRow.appendChild(reset);
  body.appendChild(resetRow);

  const footer = el('div', 'parent-footer');
  const summary = el('p', 'summary');
  summary.dataset.testid = 'summary';
  footer.appendChild(summary);

  const hint = el(
    'p',
    'empty-hint',
    'Mit diesen Buchstaben gibt es keine Aufgaben. Bitte Buchstaben ergänzen.',
  );
  hint.dataset.testid = 'empty-hint';
  footer.appendChild(hint);

  const cancel = el('button', 'cancel', 'Abbrechen');
  cancel.type = 'button';
  cancel.dataset.testid = 'cancel';
  cancel.addEventListener('click', () => deps.onCancel());

  const done = el('button', 'done', 'Fertig');
  done.type = 'button';
  done.dataset.testid = 'done';
  done.addEventListener('click', () => {
    deps.onDone({ version: 2, known: [...known], name: normalizeName(name.value) });
  });
  const actions = el('div', 'parent-actions');
  actions.append(cancel, done);
  footer.appendChild(actions);
  screen.appendChild(footer);

  function refresh(): void {
    const counts = countByStage(known);
    for (const [k, b] of buttons) b.setAttribute('aria-pressed', String(known.has(k)));
    const active = STAGES.filter((s) => counts[s] > 0);
    const parts = practiceParts(counts, active);
    summary.textContent = parts ? `So wird geübt: ${parts}` : '';
    summary.hidden = active.length === 0;
    hint.hidden = active.length > 0;
    done.disabled = active.length === 0;
  }

  refresh();
  root.replaceChildren(screen);
  return () => root.replaceChildren();
}
