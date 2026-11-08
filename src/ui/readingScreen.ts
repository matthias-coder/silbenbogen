import type { Outcome } from '../domain/progress';
import { buildRound } from '../domain/round';
import type { Item } from '../domain/types';
import { attachLongPress } from './longPress';
import { chooseLayoutMode, fitScale, layoutItem } from './arc';
import { createItemView } from './itemView';

const ROUND_SIZE = 10;
const PARENT_PRESS_MS = 3000;
const NOTICE_MS = 2500;
const RESIZE_TOLERANCE = 0.05;

function measure(el: Element): { width: number; height: number } | undefined {
  return el.clientWidth > 0 && el.clientHeight > 0
    ? { width: el.clientWidth, height: el.clientHeight }
    : undefined;
}

type Light = 'red' | 'yellow' | 'green';

/** Traffic-light rating: visible label, full label, and what it means for progress. */
const LIGHTS: { light: Light; text: string; label: string; outcome: Outcome }[] = [
  { light: 'red', text: 'Üben', label: 'Muss geübt werden', outcome: 'skipped' },
  { light: 'yellow', text: 'Geht so', label: 'Braucht noch etwas Übung', outcome: 'later' },
  { light: 'green', text: 'Gut', label: 'Gut gelesen', outcome: 'first' },
];

const newCardsText = (n: number): string =>
  n === 1 ? '1 neues Wort im Album!' : `${n} neue Wörter im Album!`;

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
    onOutcome?: (id: string, o: Outcome) => boolean;
    weight?: (item: Item) => number;
    name?: string;
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

  let stopWatching = () => {};
  const unmount = () => {
    detachGear();
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
  const again = h('button', 'again', 'rate again', '↻');
  again.type = 'button';
  again.setAttribute('aria-label', 'Nochmal');
  const rating = h('div', null, 'rating');
  rating.appendChild(again);
  for (const { light, text, label, outcome } of LIGHTS) {
    const b = h('button', light, `rate ${light}`, text);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => finish(outcome, light));
    rating.appendChild(b);
  }
  screen.append(dots, stage, rating);

  let round: Item[] = [];
  let index = 0;
  let results: Light[] = [];
  let newCards = 0;

  const showDots = () =>
    dotEls.forEach((d, i) => {
      d.className = results[i] ? `dot ${results[i]}` : 'dot';
    });

  function clearStage(): void {
    view?.destroy();
    view = null;
    stage.replaceChildren();
  }

  function showItem(): void {
    clearStage();
    rating.hidden = false;
    const holder = h('div', 'item', 'item');
    holder.dataset.itemId = round[index].id;
    stage.appendChild(holder);
    const fit = measure(holder);
    builtFit = null;
    if (fit) {
      const syl = round[index].syllables;
      const mode = chooseLayoutMode(syl, fit.width, fit.height);
      builtFit = { mode, scale: fitScale(layoutItem(syl, mode), fit.width, fit.height) };
    }
    view = createItemView(round[index], () => {}, fit);
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
    rating.hidden = true;
    const done = h('div', 'done', 'done');
    const restart = h('button', 'restart', 'restart', 'Nochmal');
    restart.type = 'button';
    restart.addEventListener('click', startRound);
    const read = results.filter((r) => r === 'green').length;
    done.append(
      h('p', null, 'done-title', deps.name ? `Geschafft, ${deps.name}!` : 'Geschafft!'),
      h('p', 'score', 'score', `${read} von ${ROUND_SIZE} gut gelesen`),
    );
    if (newCards > 0) done.appendChild(h('p', 'new-cards', 'new-cards', newCardsText(newCards)));
    done.appendChild(restart);
    stage.appendChild(done);
  }

  function startRound(): void {
    round = buildRound(deps.pool, deps.rng, ROUND_SIZE, deps.weight);
    index = 0;
    results = [];
    newCards = 0;
    showDots();
    showItem();
  }

  function finish(outcome: Outcome, light: Light): void {
    if (index >= round.length) return;
    if (deps.onOutcome?.(round[index].id, outcome)) newCards++;
    results[index] = light;
    index++;
    showDots();
    if (index >= round.length) showDone();
    else showItem();
  }

  again.addEventListener('click', showItem);

  startRound();
  return unmount;
}
