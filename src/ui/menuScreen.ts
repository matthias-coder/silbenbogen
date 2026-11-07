import type { Area } from '../domain/areas';
import { attachLongPress } from './longPress';

const PARENT_PRESS_MS = 3000;
const NOTICE_MS = 2500;

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

/** Start menu: one big tile per practice area. */
export function mountMenuScreen(
  root: HTMLElement,
  deps: {
    areas: Area[];
    onPick: (area: Area) => void;
    onOpenParent: () => void;
    notice?: string;
  },
): () => void {
  const screen = h('div', null, 'reading menu');
  screen.addEventListener('contextmenu', (e) => e.preventDefault());

  const gear = h('button', 'gear', 'gear', '⚙');
  gear.type = 'button';
  gear.setAttribute('aria-label', 'Elternbereich (3 Sekunden halten)');
  const detachGear = attachLongPress(gear, PARENT_PRESS_MS, deps.onOpenParent, {
    onStart: () => gear.classList.add('holding'),
    onEnd: () => gear.classList.remove('holding'),
  });

  const grid = h('div', 'areas', 'areas');
  for (const area of deps.areas) {
    const tile = h('button', `area-${area.id}`, 'area');
    tile.type = 'button';
    if (area.example) tile.appendChild(h('span', null, 'area-example', area.example));
    tile.appendChild(h('span', null, 'area-title', area.title));
    tile.addEventListener('click', () => deps.onPick(area));
    grid.appendChild(tile);
  }
  if (deps.areas.length === 0) {
    grid.appendChild(h('p', 'empty', 'empty', 'Im Elternbereich Buchstaben auswählen.'));
  }
  screen.append(gear, grid);

  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  if (deps.notice) {
    const notice = h('div', 'notice', 'notice', deps.notice);
    screen.appendChild(notice);
    noticeTimer = setTimeout(() => notice.remove(), NOTICE_MS);
  }
  root.replaceChildren(screen);

  return () => {
    detachGear();
    clearTimeout(noticeTimer);
    root.replaceChildren();
  };
}
