import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { randomSyllables } from '../domain/pool';
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
  let unmount: () => void;
  const q = (id: string) => root.querySelector(`[data-testid="${id}"]`) as HTMLElement;

  const dot = (i: number) => q('dots').children[i] as HTMLElement;
  const down = (el: Element) => el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  const up = (el: Element) => el.dispatchEvent(new Event('pointerup', { bubbles: true }));
  const itemEl = () => q('item').querySelector('svg')!;
  const hold = (ms: number) => {
    down(q('next'));
    vi.advanceTimersByTime(ms);
    up(q('next'));
  };
  const skip = () => hold(2000);
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
    unmount = mountReadingScreen(root, { pool: pool(), onOpenParent, rng: mulberry32(1) });
  });
  afterEach(() => {
    unmount();
    root.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (SVGSVGElement.prototype as unknown as Record<string, unknown>).getScreenCTM;
    delete (SVGSVGElement.prototype as unknown as Record<string, unknown>).setPointerCapture;
  });

  it('shows one item, ten empty dots and the next button', () => {
    expect(q('item').querySelectorAll('svg')).toHaveLength(1);
    expect(q('dots').children).toHaveLength(10);
    expect(q('dots').querySelectorAll('.on')).toHaveLength(0);
    expect(q('next').textContent).toBe('Weiter');
    expect(q('done')).toBeNull();
  });

  it('starts with a locked next button that ignores clicks', () => {
    expect(q('next').classList.contains('locked')).toBe(true);
    expect(q('next').getAttribute('aria-disabled')).toBe('true');
    expect(q('next').hasAttribute('disabled')).toBe(false);
    const before = itemEl();
    q('next').click();
    expect(itemEl()).toBe(before);
    expect(q('dots').querySelectorAll('.on, .skipped')).toHaveLength(0);
  });

  it('skips by holding the locked next button for 2 seconds', () => {
    const before = itemEl();
    down(q('next'));
    expect(q('next').classList.contains('holding')).toBe(true);
    vi.advanceTimersByTime(1999);
    expect(itemEl()).toBe(before);
    vi.advanceTimersByTime(1);
    expect(itemEl()).not.toBe(before);
    expect(dot(0).classList.contains('skipped')).toBe(true);
    expect(dot(0).classList.contains('on')).toBe(false);
    expect(q('next').classList.contains('holding')).toBe(false);
    up(q('next'));
  });

  it('cancels the skip when released early', () => {
    const before = itemEl();
    hold(1999);
    vi.advanceTimersByTime(5000);
    expect(itemEl()).toBe(before);
    expect(q('next').classList.contains('holding')).toBe(false);
    expect(dot(0).classList.contains('skipped')).toBe(false);
  });

  it('unlocks next once the item is traced, then advances on click', () => {
    complete();
    expect(q('next').classList.contains('locked')).toBe(false);
    expect(q('next').hasAttribute('aria-disabled')).toBe(false);
    expect(q('next').classList.contains('ready')).toBe(true);
    const before = itemEl();
    q('next').click();
    expect(itemEl()).not.toBe(before);
    expect(dot(0).classList.contains('on')).toBe(true);
    expect(q('next').classList.contains('locked')).toBe(true);
  });

  it('does not skip when an unlocked button is held', () => {
    complete();
    const before = itemEl();
    hold(2500);
    expect(itemEl()).toBe(before);
    expect(q('next').classList.contains('holding')).toBe(false);
  });

  it('shows the read count after ten tasks and restarts with Nochmal', () => {
    for (let i = 0; i < 3; i++) {
      complete();
      q('next').click();
    }
    for (let i = 0; i < 7; i++) skip();
    expect(q('done').textContent).toContain('Geschafft!');
    expect(q('score').textContent).toBe('3 von 10 gelesen');
    expect(q('item')).toBeNull();
    expect([...q('dots').children].map((d) => d.className)).toEqual([
      ...Array(3).fill('dot on'),
      ...Array(7).fill('dot skipped'),
    ]);
    q('again').click();
    expect(q('done')).toBeNull();
    expect(q('dots').querySelectorAll('.on, .skipped')).toHaveLength(0);
    expect(q('item').querySelectorAll('svg')).toHaveLength(1);
  });

  it('shows 0 von 10 when everything was skipped', () => {
    for (let i = 0; i < 10; i++) skip();
    expect(q('score').textContent).toBe('0 von 10 gelesen');
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
      expect(q('next').classList.contains('locked')).toBe(false);
      size = { w: 343, h: 660 };
      const before = itemEl();
      window.dispatchEvent(new Event('resize'));
      expect(itemEl()).not.toBe(before);
      expect(itemEl().hasAttribute('width')).toBe(true);
      expect(q('next').classList.contains('locked')).toBe(true);
      const again = itemEl();
      window.dispatchEvent(new Event('resize'));
      expect(itemEl()).toBe(again);
    });

    it('stops listening after unmount', () => {
      unmount();
      size = { w: 343, h: 660 };
      expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow();
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
});
