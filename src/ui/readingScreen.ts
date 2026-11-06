import { buildRound } from '../domain/round';
import type { Item } from '../domain/types';
import { attachLongPress } from './longPress';
import { createItemView } from './itemView';

const ROUND_SIZE = 10;
const PARENT_PRESS_MS = 3000;
const SKIP_PRESS_MS = 2000;

type Result = 'read' | 'skipped';

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  testId: string | null,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (testId) e.dataset.testid = testId;
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

export function mountReadingScreen(
  root: HTMLElement,
  deps: { pool: Item[]; onOpenParent: () => void; rng?: () => number },
): () => void {
  const screen = h('div', null, 'reading');
  screen.addEventListener('contextmenu', (e) => e.preventDefault());

  const gear = h('button', 'gear', 'gear', '⚙');
  gear.type = 'button';
  gear.setAttribute('aria-label', 'Elternbereich (3 Sekunden halten)');
  const detachGear = attachLongPress(gear, PARENT_PRESS_MS, deps.onOpenParent);
  screen.appendChild(gear);
  root.replaceChildren(screen);

  let detachNext = () => {};
  const unmount = () => {
    detachGear();
    detachNext();
    view?.destroy();
    view = null;
    root.replaceChildren();
  };

  let view: ReturnType<typeof createItemView> | null = null;
  if (deps.pool.length === 0) return unmount;

  const dots = h('div', 'dots', 'dots');
  const dotEls = Array.from({ length: ROUND_SIZE }, () => dots.appendChild(h('span', null, 'dot')));
  const stage = h('div', null, 'stage');
  const next = h('button', 'next', 'next', 'Weiter');
  next.type = 'button';
  screen.append(dots, stage, next);

  let round: Item[] = [];
  let index = 0;
  let results: Result[] = [];

  const showDots = () =>
    dotEls.forEach((d, i) => {
      d.classList.toggle('on', results[i] === 'read');
      d.classList.toggle('skipped', results[i] === 'skipped');
    });

  const isLocked = () => next.classList.contains('locked');
  const lock = () => {
    next.classList.add('locked');
    next.classList.remove('ready', 'holding');
    next.setAttribute('aria-disabled', 'true');
  };
  const unlock = () => {
    next.classList.remove('locked', 'holding');
    next.removeAttribute('aria-disabled');
    next.classList.add('ready');
  };

  function clearStage(): void {
    view?.destroy();
    view = null;
    stage.replaceChildren();
  }

  function showItem(): void {
    clearStage();
    next.hidden = false;
    lock();
    const holder = h('div', 'item', 'item');
    view = createItemView(round[index], unlock);
    holder.appendChild(view.el);
    stage.appendChild(holder);
  }

  function showDone(): void {
    clearStage();
    next.hidden = true;
    const done = h('div', 'done', 'done');
    const again = h('button', 'again', 'again', 'Nochmal');
    again.type = 'button';
    again.addEventListener('click', startRound);
    const read = results.filter((r) => r === 'read').length;
    done.append(
      h('p', null, 'done-title', 'Geschafft!'),
      h('p', 'score', 'score', `${read} von ${ROUND_SIZE} gelesen`),
      again,
    );
    stage.appendChild(done);
  }

  function startRound(): void {
    round = buildRound(deps.pool, deps.rng, ROUND_SIZE);
    index = 0;
    results = [];
    showDots();
    showItem();
  }

  function advance(result: Result): void {
    results[index] = result;
    index++;
    showDots();
    if (index >= round.length) showDone();
    else showItem();
  }

  next.addEventListener('click', () => {
    if (!isLocked()) advance('read');
  });
  detachNext = attachLongPress(next, SKIP_PRESS_MS, () => {
    if (isLocked()) advance('skipped');
  }, {
    onStart: () => {
      if (isLocked()) next.classList.add('holding');
    },
    onEnd: () => next.classList.remove('holding'),
  });

  startRound();
  return unmount;
}
