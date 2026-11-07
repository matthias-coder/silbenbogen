import { stageProgress } from '../domain/album';
import { countByStage } from '../domain/pool';
import type { Progress } from '../domain/progress';
import { STAGE_LABELS, STAGES, reasonFor, unit } from '../domain/stageInfo';
import type { Stage } from '../domain/types';
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

/** Start menu: one row per stage, "Alles gemischt", the album and the gear. */
export function mountMenuScreen(
  root: HTMLElement,
  deps: {
    known: ReadonlySet<string>;
    progress: Progress;
    name: string;
    onPick: (stages: Stage[]) => void;
    onOpenAlbum: () => void;
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

  const body = h('div', null, 'menu-body');
  if (deps.name) body.appendChild(h('h1', 'greeting', 'greeting', `Hallo ${deps.name}!`));

  const counts = countByStage(deps.known);
  const available = STAGES.filter((s) => counts[s] > 0);
  const list = h('div', 'stages', 'stages');
  for (const s of STAGES) {
    const row = h('button', `stage-${s}`, 'stage-row');
    row.type = 'button';
    const text = h('span', null, 'stage-text');
    text.appendChild(h('span', null, 'stage-name', STAGE_LABELS[s]));
    if (counts[s] > 0) {
      const sp = stageProgress(s, deps.known, deps.progress);
      const line = sp.practised || sp.learned > 0 ? `${sp.learned} von ${sp.total} sicher` : 'noch nicht geübt';
      text.appendChild(h('span', null, 'stage-progress', line));
      row.addEventListener('click', () => deps.onPick([s]));
    } else {
      row.classList.add('off');
      row.setAttribute('aria-disabled', 'true');
      text.appendChild(h('span', null, 'stage-reason', reasonFor(s, deps.known)));
    }
    row.append(h('span', null, 'stage-no', String(s)), text, h('span', null, 'stage-count', `${counts[s]} ${unit(s)}`));
    list.appendChild(row);
  }
  body.appendChild(list);

  const actions = h('div', null, 'menu-actions');
  if (available.length >= 2) {
    const mixed = h('button', 'mixed', 'mixed', 'Alles gemischt');
    mixed.type = 'button';
    mixed.addEventListener('click', () => deps.onPick([...available]));
    actions.appendChild(mixed);
  }
  const album = h('button', 'album', 'album-button', 'Meine Wörter');
  album.type = 'button';
  album.addEventListener('click', deps.onOpenAlbum);
  actions.appendChild(album);
  body.appendChild(actions);

  screen.append(gear, body);

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
