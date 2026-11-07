import { buildRound } from '../domain/round';
import type { Item } from '../domain/types';
import { attachLongPress } from './longPress';
import { chooseLayoutMode, fitScale, layoutItem } from './arc';
import { createItemView } from './itemView';

const ROUND_SIZE = 10;
const PARENT_PRESS_MS = 3000;
const SKIP_PRESS_MS = 2000;
const NOTICE_MS = 2500;
const RESIZE_TOLERANCE = 0.05;

function measure(el: Element): { width: number; height: number } | undefined {
  return el.clientWidth > 0 && el.clientHeight > 0
    ? { width: el.clientWidth, height: el.clientHeight }
    : undefined;
}

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
  deps: {
    pool: Item[];
    onOpenParent: () => void;
    onHome?: () => void;
    rng?: () => number;
    notice?: string;
  },
): () => void {
  const screen = h('div', null, 'reading');
  screen.addEventListener('contextmenu', (e) => e.preventDefault());

  const gear = h('button', 'gear', 'gear', '⚙');
  gear.type = 'button';
  gear.setAttribute('aria-label', 'Elternbereich (3 Sekunden halten)');
  const detachGear = attachLongPress(gear, PARENT_PRESS_MS, deps.onOpenParent, {
    onStart: () => gear.classList.add('holding'),
    onEnd: () => gear.classList.remove('holding'),
  });
  screen.appendChild(gear);
  if (deps.onHome) {
    const home = h('button', 'home', 'home');
    home.type = 'button';
    home.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h5v-6h3v6h5V10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    home.setAttribute('aria-label', 'Zurück zur Auswahl');
    home.addEventListener('click', deps.onHome);
    screen.appendChild(home);
  }
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  if (deps.notice) {
    const notice = h('div', 'notice', 'notice', deps.notice);
    screen.appendChild(notice);
    noticeTimer = setTimeout(() => notice.remove(), NOTICE_MS);
  }
  root.replaceChildren(screen);

  let detachNext: ReturnType<typeof attachLongPress> | null = null;
  const cancelHold = () => detachNext?.cancel();
  let pressedWhileLocked = false;
  let stopWatching = () => {};
  const unmount = () => {
    detachGear();
    detachNext?.();
    stopWatching();
    clearTimeout(noticeTimer);
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
    cancelHold();
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
    cancelHold();
    next.hidden = false;
    lock();
    const holder = h('div', 'item', 'item');
    stage.appendChild(holder);
    const fit = measure(holder);
    builtFit = null;
    if (fit) {
      const syl = round[index].syllables;
      const mode = chooseLayoutMode(syl, fit.width, fit.height);
      builtFit = { mode, scale: fitScale(layoutItem(syl, mode), fit.width, fit.height) };
    }
    view = createItemView(round[index], unlock, fit);
    holder.appendChild(view.el);
  }

  let builtFit: { mode: string; scale: number } | null = null;
  const onStageResize = () => {
    const holder = stage.firstElementChild;
    if (!view || !holder) return;
    const fit = measure(holder);
    if (!fit && !builtFit) return;
    if (fit && builtFit) {
      const syl = round[index].syllables;
      const mode = chooseLayoutMode(syl, fit.width, fit.height);
      const scale = fitScale(layoutItem(syl, mode), fit.width, fit.height);
      if (mode === builtFit.mode && Math.abs(scale / builtFit.scale - 1) <= RESIZE_TOLERANCE) return;
    }
    showItem();
  };
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(onStageResize);
    observer.observe(stage);
    stopWatching = () => observer.disconnect();
  } else {
    window.addEventListener('resize', onStageResize);
    stopWatching = () => window.removeEventListener('resize', onStageResize);
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

  next.addEventListener('pointerdown', () => {
    pressedWhileLocked = isLocked();
  });
  next.addEventListener('click', () => {
    const fromLockedPress = pressedWhileLocked;
    pressedWhileLocked = false;
    if (!fromLockedPress && !isLocked()) advance('read');
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
