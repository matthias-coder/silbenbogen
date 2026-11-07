import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { randomSyllables } from '../domain/pool';
import type { Outcome } from '../domain/progress';
import { makeWord } from '../domain/stage';
import { mulberry32 } from '../testing/rng';
import { mountReadingScreen } from './readingScreen';

const pool = () => randomSyllables(1, new Set(['m', 'a', 'e', 'i', 'o', 'u']));

const identity = { inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) };

class FakePoint {
  constructor(public x: number, public y: number) {}
  matrixTransform(m: { a: number; b: number; c: number; d: number; e: number; f: number }) {
    return { x: m.a * this.x + m.c * this.y + m.e, y: m.b * this.x + m.d * this.y + m.f };
  }
}

describe('mountReadingScreen', () => {
  let root: HTMLElement;
  let onOpenParent: Mock<() => void>;
  let onOutcome: Mock<(id: string, o: Outcome) => boolean>;
  let unmount: () => void;
  const q = (id: string) => root.querySelector(`[data-testid="${id}"]`) as HTMLElement;

  const dot = (i: number) => q('dots').children[i] as HTMLElement;
  const down = (el: Element) => el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  const up = (el: Element) => el.dispatchEvent(new Event('pointerup', { bubbles: true }));
  const itemEl = () => q('item').querySelector('svg')!;
  const itemId = () => q('item').dataset.itemId;
  /** Drags every handle of the current item to the end of its arc. */
  const complete = () => {
    const svg = itemEl();
    const handles = [...svg.querySelectorAll('g.handle')];
    handles.forEach((handle, k) => {
      const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(handle.getAttribute('transform')!)!;
      const fire = (type: string, x: number, y: number) => {
        const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
        Object.defineProperty(e, 'pointerId', { value: k + 1 });
        svg.dispatchEvent(e);
      };
      fire('pointerdown', Number(m[1]), Number(m[2]));
      fire('pointermove', 5000, Number(m[2]));
      fire('pointerup', 5000, Number(m[2]));
    });
  };

  beforeEach(() => {
    vi.stubGlobal('DOMPoint', FakePoint);
    (SVGSVGElement.prototype as unknown as Record<string, unknown>).getScreenCTM = () => identity;
    (SVGSVGElement.prototype as unknown as Record<string, unknown>).setPointerCapture = () => {};
    vi.useFakeTimers();
    root = document.createElement('div');
    document.body.appendChild(root);
    onOpenParent = vi.fn();
    onOutcome = vi.fn(() => false);
    unmount = mountReadingScreen(root, { pool: pool(), onOpenParent, onOutcome, rng: mulberry32(1) });
  });
  afterEach(() => {
    unmount();
    root.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (SVGSVGElement.prototype as unknown as Record<string, unknown>).getScreenCTM;
    delete (SVGSVGElement.prototype as unknown as Record<string, unknown>).setPointerCapture;
  });

  const good = () => q('good').click();
  const again = () => q('again').click();
  const text = () => q('item').textContent;
  const outcomes = () => onOutcome.mock.calls.map((c) => c[1]);

  it('shows one item, ten empty dots, three try dots and both rating buttons', () => {
    expect(q('item').querySelectorAll('svg')).toHaveLength(1);
    expect(q('dots').children).toHaveLength(10);
    expect(q('dots').querySelectorAll('.on')).toHaveLength(0);
    expect(q('tries').children).toHaveLength(3);
    expect(q('tries').querySelectorAll('.on')).toHaveLength(1);
    expect(q('again').textContent).toBe('Nochmal');
    expect(q('good').textContent).toBe('Gut gelesen');
    expect(q('next')).toBeNull();
    expect(q('done')).toBeNull();
  });

  it('locks both buttons until the item is traced and ignores clicks meanwhile', () => {
    for (const id of ['again', 'good']) {
      expect(q(id).classList.contains('locked')).toBe(true);
      expect(q(id).getAttribute('aria-disabled')).toBe('true');
    }
    const before = itemEl();
    good();
    again();
    expect(itemEl()).toBe(before);
    expect(onOutcome).not.toHaveBeenCalled();
    complete();
    for (const id of ['again', 'good']) {
      expect(q(id).classList.contains('locked')).toBe(false);
      expect(q(id).hasAttribute('aria-disabled')).toBe(false);
    }
  });

  it('records a first-try read and moves on', () => {
    const id = itemId();
    complete();
    good();
    expect(onOutcome).toHaveBeenCalledWith(id, 'first');
    expect(dot(0).classList.contains('on')).toBe(true);
    expect(q('good').classList.contains('locked')).toBe(true);
    expect(q('tries').querySelectorAll('.on')).toHaveLength(1);
  });

  it('repeats the same item on Nochmal and records a later read', () => {
    const id = itemId();
    const first = text();
    complete();
    again();
    expect(text()).toBe(first);
    expect(q('tries').querySelectorAll('.on')).toHaveLength(2);
    expect(q('good').classList.contains('locked')).toBe(true);
    complete();
    again();
    expect(text()).toBe(first);
    expect(q('tries').querySelectorAll('.on')).toHaveLength(3);
    complete();
    good();
    expect(onOutcome).toHaveBeenCalledTimes(1);
    expect(onOutcome).toHaveBeenCalledWith(id, 'later');
    expect(dot(0).classList.contains('on')).toBe(true);
  });

  it('turns Nochmal into Überspringen on the third try', () => {
    const id = itemId();
    complete();
    again();
    expect(q('again').textContent).toBe('Nochmal');
    complete();
    again();
    expect(q('again').textContent).toBe('Überspringen');
    complete();
    again();
    expect(onOutcome).toHaveBeenCalledWith(id, 'skipped');
    expect(dot(0).classList.contains('skipped')).toBe(true);
    expect(q('again').textContent).toBe('Nochmal');
  });

  it('records nothing when leaving mid-word', () => {
    unmount();
    const onHome = vi.fn();
    unmount = mountReadingScreen(root, { pool: pool(), onOpenParent, onOutcome, onHome, rng: mulberry32(1) });
    complete();
    again();
    q('home').click();
    expect(onHome).toHaveBeenCalledOnce();
    expect(onOutcome).not.toHaveBeenCalled();
  });

  const finish = (pattern: ('good' | 'later' | 'skip')[]) => {
    for (const step of pattern) {
      complete();
      if (step === 'good') good();
      else if (step === 'later') {
        again();
        complete();
        good();
      } else {
        again();
        complete();
        again();
        complete();
        again();
      }
    }
  };

  it('shows the score after ten tasks and restarts', () => {
    finish(['good', 'good', 'later', ...Array(7).fill('skip')]);
    expect(q('done').textContent).toContain('Geschafft!');
    expect(q('score').textContent).toBe('3 von 10 gut gelesen');
    expect(q('new-cards')).toBeNull();
    expect(q('item')).toBeNull();
    expect([...q('dots').children].map((d) => d.className)).toEqual([
      ...Array(3).fill('dot on'),
      ...Array(7).fill('dot skipped'),
    ]);
    expect(outcomes()).toEqual(['first', 'first', 'later', ...Array(7).fill('skipped')]);
    q('restart').click();
    expect(q('done')).toBeNull();
    expect(q('dots').querySelectorAll('.on, .skipped')).toHaveLength(0);
    expect(q('item').querySelectorAll('svg')).toHaveLength(1);
  });

  it('greets by name and counts new album cards on the done screen', () => {
    unmount();
    let n = 0;
    onOutcome.mockImplementation(() => ++n <= 2);
    unmount = mountReadingScreen(root, { pool: pool(), onOpenParent, onOutcome, name: 'Lena', rng: mulberry32(1) });
    finish(Array(10).fill('good'));
    expect(q('done').textContent).toContain('Geschafft, Lena!');
    expect(q('new-cards')!.textContent).toBe('2 neue Wörter im Album!');
  });

  it('uses the singular for one new card', () => {
    unmount();
    let n = 0;
    onOutcome.mockImplementation(() => ++n === 1);
    unmount = mountReadingScreen(root, { pool: pool(), onOpenParent, onOutcome, rng: mulberry32(1) });
    finish(Array(10).fill('good'));
    expect(q('new-cards')!.textContent).toBe('1 neues Wort im Album!');
  });

  it('passes the weight to the round', () => {
    unmount();
    const items = pool().slice(0, 2);
    const heavy = items[1].id;
    unmount = mountReadingScreen(root, {
      pool: items,
      onOpenParent,
      onOutcome,
      weight: (i) => (i.id === heavy ? 1e6 : 1),
      rng: mulberry32(1),
    });
    expect(itemId()).toBe(heavy);
  });

  it('prevents the context menu', () => {
    const ev = new Event('contextmenu', { bubbles: true, cancelable: true });
    q('gear').dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('opens the parent area only after a 3 second long press', () => {
    q('gear').click();
    expect(onOpenParent).not.toHaveBeenCalled();
    q('gear').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(2999);
    expect(onOpenParent).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onOpenParent).toHaveBeenCalledTimes(1);
  });

  it('marks the gear as holding only while it is pressed', () => {
    down(q('gear'));
    expect(q('gear').classList.contains('holding')).toBe(true);
    vi.advanceTimersByTime(1000);
    up(q('gear'));
    expect(q('gear').classList.contains('holding')).toBe(false);
    down(q('gear'));
    vi.advanceTimersByTime(3000);
    expect(onOpenParent).toHaveBeenCalledTimes(1);
    expect(q('gear').classList.contains('holding')).toBe(false);
  });

  it('shows a notice for 2.5 seconds when given one', () => {
    expect(q('notice')).toBeNull();
    unmount();
    unmount = mountReadingScreen(root, {
      pool: pool(), onOpenParent, rng: mulberry32(1), notice: 'Gespeichert: 25 Silben',
    });
    expect(q('notice').textContent).toBe('Gespeichert: 25 Silben');
    vi.advanceTimersByTime(2499);
    expect(q('notice')).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(q('notice')).toBeNull();
  });

  it('renders only the gear for an empty pool', () => {
    const r = document.createElement('div');
    const u = mountReadingScreen(r, { pool: [], onOpenParent: () => {} });
    expect(r.querySelector('[data-testid="gear"]')).not.toBeNull();
    expect(r.querySelector('[data-testid="item"]')).toBeNull();
    expect(r.querySelector('[data-testid="next"]')).toBeNull();
    u();
  });

  it('shows a home button only when onHome is given, and calls it on tap', () => {
    expect(q('home')).toBeNull();
    unmount();
    const onHome = vi.fn();
    unmount = mountReadingScreen(root, { pool: pool(), onOpenParent, onHome, rng: mulberry32(1) });
    q('home').click();
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('empties the root on unmount', () => {
    unmount();
    expect(root.childElementCount).toBe(0);
  });

  describe('fitting to the stage', () => {
    let size = { w: 0, h: 0 };
    beforeEach(() => {
      size = { w: 0, h: 0 };
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => size.w });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => size.h });
    });
    afterEach(() => {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight;
    });

    it('behaves like before when the stage has no size', () => {
      expect(itemEl().hasAttribute('width')).toBe(false);
    });

    it('rebuilds the current item with the new fit on resize and relocks it', () => {
      complete();
      expect(q('good').classList.contains('locked')).toBe(false);
      size = { w: 343, h: 660 };
      const before = itemEl();
      window.dispatchEvent(new Event('resize'));
      expect(itemEl()).not.toBe(before);
      expect(itemEl().hasAttribute('width')).toBe(true);
      expect(q('good').classList.contains('locked')).toBe(true);
      const again = itemEl();
      window.dispatchEvent(new Event('resize'));
      expect(itemEl()).toBe(again);
    });

    it('stops listening after unmount', () => {
      const remove = vi.spyOn(window, 'removeEventListener');
      const add = vi.spyOn(window, 'addEventListener');
      unmount();
      unmount = mountReadingScreen(root, { pool: pool(), onOpenParent, rng: mulberry32(1) });
      const handler = add.mock.calls.find((c) => c[0] === 'resize')![1];
      unmount();
      expect(remove).toHaveBeenCalledWith('resize', handler);
      size = { w: 343, h: 660 };
      window.dispatchEvent(new Event('resize'));
      expect(root.childElementCount).toBe(0);
      remove.mockRestore();
      add.mockRestore();
    });

    it('ignores pixel-level resizes but rebuilds on a >5% scale change', () => {
      size = { w: 343, h: 660 };
      window.dispatchEvent(new Event('resize'));
      const built = itemEl();
      size = { w: 344, h: 660 };
      window.dispatchEvent(new Event('resize'));
      expect(itemEl()).toBe(built);
      size = { w: 343, h: 700 };
      window.dispatchEvent(new Event('resize'));
      expect(itemEl()).toBe(built);
      size = { w: 700, h: 660 };
      window.dispatchEvent(new Event('resize'));
      expect(itemEl()).not.toBe(built);
    });

    it('rebuilds when the layout mode flips between row and stack', () => {
      unmount();
      unmount = mountReadingScreen(root, { pool: [makeWord('Kro-ko-dil')], onOpenParent, rng: mulberry32(1) });
      size = { w: 1184, h: 600 };
      window.dispatchEvent(new Event('resize'));
      expect(itemEl().getAttribute('viewBox')).toBe('0 0 1210 330');
      const row = itemEl();
      size = { w: 1190, h: 600 };
      window.dispatchEvent(new Event('resize'));
      expect(itemEl()).toBe(row);
      size = { w: 343, h: 660 };
      window.dispatchEvent(new Event('resize'));
      expect(itemEl()).not.toBe(row);
      expect(itemEl().getAttribute('viewBox')).toBe('0 0 442 930');
    });

    it('uses a ResizeObserver when available and disconnects it on unmount', () => {
      unmount();
      let cb: () => void = () => {};
      const disconnect = vi.fn();
      class FakeRO {
        constructor(c: () => void) { cb = c; }
        observe() {}
        disconnect = disconnect;
      }
      vi.stubGlobal('ResizeObserver', FakeRO);
      unmount = mountReadingScreen(root, { pool: pool(), onOpenParent, rng: mulberry32(1) });
      size = { w: 343, h: 660 };
      const before = itemEl();
      cb();
      expect(itemEl()).not.toBe(before);
      unmount();
      expect(disconnect).toHaveBeenCalledTimes(1);
    });
  });

  it('clears the notice timer on unmount', () => {
    unmount();
    unmount = mountReadingScreen(root, { pool: pool(), onOpenParent, notice: 'Gespeichert: 25 Silben' });
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    unmount();
    expect(clear).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    clear.mockRestore();
  });
});
