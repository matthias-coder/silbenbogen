import { GROUPS, LETTERS } from '../domain/graphemes';
import { countByStage } from '../domain/pool';
import type { Settings, Stage } from '../domain/types';

const STAGE_LABELS: Record<Stage, string> = {
  1: 'Mitlaut + Selbstlaut (Ma, Se)',
  2: 'Selbstlaut + Mitlaut (Am, El)',
  3: 'Wörter aus Zweier-Silben (Ma-ma, Na-se)',
  4: 'Silben mit drei Lauten (Mut, Son-ne)',
  5: 'Buchstabengruppen (Schu-le, Ei-mer)',
  6: 'Mehrere Mitlaute (Blu-me, Brot)',
};
const STAGES: readonly Stage[] = [1, 2, 3, 4, 5, 6];

const REASON_SYLLABLES = 'Dafür braucht es mindestens einen Mitlaut und einen Selbstlaut.';
const REASON_GROUP = 'Dafür fehlt eine Buchstabengruppe (z. B. Sch, Ei, Au).';
const REASON_WORDS = 'Mit diesen Buchstaben gibt es dafür noch keine Wörter.';

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
  deps: { settings: Settings; onDone: (s: Settings) => void; onCancel: () => void },
): () => void {
  const known = new Set(deps.settings.known);
  const wanted = new Set<Stage>(STAGES);

  const screen = el('div', 'parent');
  const body = el('div', 'parent-body');
  screen.appendChild(body);
  body.appendChild(el('h1', 'parent-page-title', 'Elternbereich'));
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

  body.appendChild(el('h2', 'parent-title', 'Was wird geübt'));
  const boxes = new Map<Stage, HTMLInputElement>();
  const counters = new Map<Stage, HTMLElement>();
  const reasons = new Map<Stage, HTMLElement>();
  const list = el('div', 'stage-list');
  for (const s of STAGES) {
    const item = el('div', 'stage-item');
    const row = el('label', 'stage-row');
    const box = el('input');
    box.type = 'checkbox';
    box.dataset.stage = String(s);
    box.addEventListener('change', () => {
      if (box.checked) wanted.add(s);
      else wanted.delete(s);
      refresh();
    });
    const counter = el('span', 'stage-count');
    counter.dataset.count = String(s);
    boxes.set(s, box);
    counters.set(s, counter);
    const reason = el('p', 'stage-reason');
    reason.dataset.reason = String(s);
    reasons.set(s, reason);
    row.append(box, el('span', 'stage-label', STAGE_LABELS[s]), counter);
    item.append(row, reason);
    list.appendChild(item);
  }
  body.appendChild(list);

  const footer = el('div', 'parent-footer');
  const summary = el('p', 'summary');
  summary.dataset.testid = 'summary';
  footer.appendChild(summary);

  const hint = el(
    'p',
    'empty-hint',
    'Mit dieser Auswahl gibt es keine Aufgaben. Bitte Buchstaben oder Stufen ergänzen.',
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
    deps.onDone({ version: 2, known: [...known], name: deps.settings.name });
  });
  const actions = el('div', 'parent-actions');
  actions.append(cancel, done);
  footer.appendChild(actions);
  screen.appendChild(footer);

  const activeStages = (): Stage[] => {
    const counts = countByStage(known);
    return STAGES.filter((s) => wanted.has(s) && counts[s] > 0);
  };

  const reasonFor = (s: Stage): string => {
    if (s <= 2) return REASON_SYLLABLES;
    if (s === 5 && !GROUPS.some((g) => known.has(g))) return REASON_GROUP;
    return REASON_WORDS;
  };

  function refresh(): void {
    const counts = countByStage(known);
    for (const [k, b] of buttons) b.setAttribute('aria-pressed', String(known.has(k)));
    for (const s of STAGES) {
      const available = counts[s] > 0;
      boxes.get(s)!.checked = wanted.has(s) && available;
      boxes.get(s)!.disabled = !available;
      counters.get(s)!.textContent = `${counts[s]} ${s <= 2 ? 'Silben' : 'Wörter'}`;
      const reason = reasons.get(s)!;
      reason.hidden = available;
      reason.textContent = available ? '' : reasonFor(s);
    }
    const active = activeStages();
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
