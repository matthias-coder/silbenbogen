import type { AlbumPage, Card } from '../domain/album';
import { STAGE_TABS } from '../domain/stageInfo';

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

/** German possessive: "Lenas", but "Max’" for names ending in an s sound. */
const possessive = (name: string): string => (/[sßxz]$/i.test(name) ? `${name}’` : `${name}s`);

const HOME_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h5v-6h3v6h5V10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function cardEl(card: Card): HTMLElement {
  if (!card.learned) return h('div', null, 'card empty');
  const el = h('div', null, card.fresh ? 'card learned fresh' : 'card learned', card.text);
  if (card.fresh) el.appendChild(h('span', null, 'badge', 'neu'));
  return el;
}

/** Collection album: one tab per stage, learned cards and grey empty slots. */
export function mountAlbumScreen(
  root: HTMLElement,
  deps: { pages: AlbumPage[]; name: string; onHome: () => void },
): () => void {
  const screen = h('div', null, 'reading album');
  screen.addEventListener('contextmenu', (e) => e.preventDefault());

  const home = h('button', 'home', 'home');
  home.type = 'button';
  home.innerHTML = HOME_ICON;
  home.setAttribute('aria-label', 'Zurück zur Auswahl');
  home.addEventListener('click', deps.onHome);

  const body = h('div', null, 'album-body');
  const head = h('div', null, 'album-head');
  const learned = deps.pages.reduce((n, p) => n + p.learned, 0);
  const total = deps.pages.reduce((n, p) => n + p.cards.length, 0);
  head.append(
    h('h1', 'album-title', 'album-title', deps.name ? `${possessive(deps.name)} Wörter` : 'Meine Wörter'),
    h('span', 'album-total', 'album-total', `${learned} von ${total} gesammelt`),
  );
  body.appendChild(head);

  if (deps.pages.length === 0) {
    body.appendChild(
      h('p', 'album-empty', 'album-empty', 'Noch keine Wörter. Im Elternbereich Buchstaben auswählen.'),
    );
  } else {
    const tabs = h('div', null, 'album-tabs');
    tabs.setAttribute('role', 'tablist');
    const grid = h('div', 'album-grid', 'album-grid');
    const tabEls: HTMLButtonElement[] = [];
    const show = (i: number) => {
      tabEls.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
      grid.replaceChildren(...deps.pages[i].cards.map(cardEl));
    };
    deps.pages.forEach((page, i) => {
      const tab = h('button', `tab-${page.stage}`, 'album-tab', STAGE_TABS[page.stage]);
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.addEventListener('click', () => show(i));
      tabEls.push(tab);
      tabs.appendChild(tab);
    });
    body.append(tabs, grid);
    show(0);
  }

  screen.append(home, body);
  root.replaceChildren(screen);
  return () => root.replaceChildren();
}
