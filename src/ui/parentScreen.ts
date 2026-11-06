import { GROUPS, LETTERS } from '../domain/graphemes';
import { countByStage, reconcileStages } from '../domain/pool';
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
  deps: { settings: Settings; onDone: (s: Settings) => void },
): () => void {
  const known = new Set(deps.settings.known);
  let stages = new Set<Stage>(deps.settings.stages);

  const screen = el('div', 'parent');
  screen.appendChild(el('h1', 'parent-title', 'Bekannte Buchstaben'));

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
    screen.appendChild(grid);
  };
  addGrid(LETTERS, 'singles');
  addGrid(GROUPS, 'groups');

  screen.appendChild(el('h2', 'parent-title', 'Was wird geübt'));
  const boxes = new Map<Stage, HTMLInputElement>();
  const counters = new Map<Stage, HTMLElement>();
  const list = el('div', 'stage-list');
  for (const s of STAGES) {
    const row = el('label', 'stage-row');
    const box = el('input');
    box.type = 'checkbox';
    box.dataset.stage = String(s);
    box.addEventListener('change', () => {
      if (box.checked) stages.add(s);
      else stages.delete(s);
      refresh();
    });
    const counter = el('span', 'stage-count');
    counter.dataset.count = String(s);
    boxes.set(s, box);
    counters.set(s, counter);
    row.append(box, el('span', 'stage-label', STAGE_LABELS[s]), counter);
    list.appendChild(row);
  }
  screen.appendChild(list);

  const hint = el(
    'p',
    'empty-hint',
    'Mit dieser Auswahl gibt es keine Aufgaben. Bitte Buchstaben oder Stufen ergänzen.',
  );
  hint.dataset.testid = 'empty-hint';
  screen.appendChild(hint);

  const done = el('button', 'done', 'Fertig');
  done.type = 'button';
  done.dataset.testid = 'done';
  done.addEventListener('click', () => {
    deps.onDone({
      version: 1,
      known: [...known],
      stages: [...stages].sort((a, b) => a - b),
    });
  });
  screen.appendChild(done);

  function refresh(): void {
    const counts = countByStage(known);
    stages = new Set(reconcileStages([...stages], counts));
    for (const [k, b] of buttons) b.setAttribute('aria-pressed', String(known.has(k)));
    for (const s of STAGES) {
      boxes.get(s)!.checked = stages.has(s);
      boxes.get(s)!.disabled = counts[s] === 0;
      counters.get(s)!.textContent = `${counts[s]} ${s <= 2 ? 'Silben' : 'Wörter'}`;
    }
    const empty = stages.size === 0;
    hint.hidden = !empty;
    done.disabled = empty;
  }

  refresh();
  root.replaceChildren(screen);
  return () => root.replaceChildren();
}
