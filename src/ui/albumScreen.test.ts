import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { AlbumPage } from '../domain/album';
import { mountAlbumScreen } from './albumScreen';

const PAGES: AlbumPage[] = [
  {
    stage: 1,
    learned: 1,
    cards: [
      { id: 'silbe-ma', text: 'Ma', learned: true, fresh: true },
      { id: 'silbe-me', text: 'Me', learned: false, fresh: false },
    ],
  },
  {
    stage: 3,
    learned: 2,
    cards: [
      { id: 'wort-mama', text: 'Mama', learned: true, fresh: false },
      { id: 'wort-nase', text: 'Nase', learned: true, fresh: false },
      { id: 'wort-rose', text: 'Rose', learned: false, fresh: false },
    ],
  },
];

describe('mountAlbumScreen', () => {
  let root: HTMLElement;
  let onHome: Mock<() => void>;
  let unmount: () => void;
  const q = (id: string) => root.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  const mount = (pages = PAGES, name = '') => {
    unmount?.();
    unmount = mountAlbumScreen(root, { pages, name, onHome });
  };
  const cards = () => [...root.querySelectorAll('.card')] as HTMLElement[];

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    onHome = vi.fn();
    mount();
  });
  afterEach(() => {
    unmount();
    root.remove();
  });

  it('titles the album with or without a name', () => {
    expect(q('album-title')!.textContent).toBe('Meine Wörter');
    mount(PAGES, 'Lena');
    expect(q('album-title')!.textContent).toBe('Lenas Wörter');
  });

  it('shows the total over all pages', () => {
    expect(q('album-total')!.textContent).toBe('3 von 5 gesammelt');
  });

  it('has one tab per page, the first one active', () => {
    expect(q('tab-1')!.textContent).toBe('1 Ma, Se');
    expect(q('tab-3')!.textContent).toBe('3 Ma-ma');
    expect(q('tab-2')).toBeNull();
    expect(q('tab-1')!.getAttribute('aria-selected')).toBe('true');
    expect(q('tab-3')!.getAttribute('aria-selected')).toBe('false');
  });

  it('shows learned cards with text and empty slots without', () => {
    expect(cards().map((c) => [c.className, c.textContent])).toEqual([
      ['card learned fresh', 'Maneu'],
      ['card empty', ''],
    ]);
    expect(root.querySelectorAll('.badge')).toHaveLength(1);
    expect(root.querySelector('.badge')!.textContent).toBe('neu');
  });

  it('switches pages with the tabs', () => {
    q('tab-3')!.click();
    expect(q('tab-3')!.getAttribute('aria-selected')).toBe('true');
    expect(cards().map((c) => c.textContent)).toEqual(['Mama', 'Nase', '']);
    expect(root.querySelectorAll('.badge')).toHaveLength(0);
  });

  it('goes home', () => {
    q('home')!.click();
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('shows an empty state without pages', () => {
    mount([]);
    expect(q('album-empty')!.textContent).toBe('Noch keine Wörter. Im Elternbereich Buchstaben auswählen.');
    expect(cards()).toHaveLength(0);
  });
});
