import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWord } from '../domain/stage';
import { createItemView } from './itemView';

describe('createItemView', () => {
  it('renders boxes, letters, tracks, progress paths and handles', () => {
    const v = createItemView(makeWord('Na-se'), () => {});
    expect(v.el.getAttribute('viewBox')).toBe('0 0 622 330');
    expect([...v.el.querySelectorAll('text')].map((t) => t.textContent)).toEqual(['N', 'a', 's', 'e']);
    expect(v.el.querySelectorAll('rect.box')).toHaveLength(4);
    expect(v.el.querySelectorAll('g.handle')).toHaveLength(2);
    expect(v.el.querySelectorAll('path.track')).toHaveLength(2);
    expect(v.el.querySelectorAll('path.progress')).toHaveLength(2);
    expect(v.el.querySelector('g.handle')!.getAttribute('transform')).toContain('translate(85,170)');
    expect(v.el.querySelectorAll('g.handle')[1].classList.contains('inactive')).toBe(true);
    expect(v.el.querySelector('g.handle path')!.getAttribute('d')).toBe('M-11 -12 L15 0 L-11 12 L-4 0 Z');
  });

  it('uses mid grey for the untraced track and the inactive handle without fading', () => {
    const v = createItemView(makeWord('Na-se'), () => {});
    expect(v.el.querySelector('path.track')!.getAttribute('stroke')).toBe('#94949c');
    const inactive = v.el.querySelectorAll('g.handle')[1];
    expect(inactive.querySelector('circle')!.getAttribute('stroke')).toBe('#94949c');
    expect(inactive.hasAttribute('opacity')).toBe(false);
    expect(v.el.querySelector('circle')!.getAttribute('r')).toBe('28');
    expect(v.el.hasAttribute('width')).toBe(false);
  });

  it('stacks the syllables and sizes the svg and handles when fitted to a narrow area', () => {
    const v = createItemView(makeWord('Kro-ko-dil'), () => {}, { width: 343, height: 660 });
    const scale = Math.min(343 / 442, 660 / 930);
    expect(v.el.getAttribute('viewBox')).toBe('0 0 442 930');
    expect(Number(v.el.getAttribute('width'))).toBeCloseTo(442 * scale);
    expect(Number(v.el.getAttribute('height'))).toBeCloseTo(930 * scale);
    const r = Math.min(Math.max(22 / scale, 28), 48);
    expect(Number(v.el.querySelector('circle')!.getAttribute('r'))).toBeCloseTo(r);
    expect(v.el.querySelector('g.handle g')!.getAttribute('transform')).toBe(`scale(${r / 28})`);
    expect(v.el.querySelectorAll('g.handle')[1].getAttribute('transform')).toMatch(/^translate\([\d.]+,470\)/);
  });

  it('keeps a row and scale 1 for a wide area', () => {
    const v = createItemView(makeWord('Kro-ko-dil'), () => {}, { width: 1184, height: 600 });
    expect(v.el.getAttribute('viewBox')).toBe('0 0 1210 330');
  });

  it('uses unique gradient ids per view', () => {
    const a = createItemView(makeWord('Ma'), () => {});
    const b = createItemView(makeWord('Ma'), () => {});
    const ida = a.el.querySelector('linearGradient')!.id;
    const idb = b.el.querySelector('linearGradient')!.id;
    expect(ida).not.toBe(idb);
  });

  it('reset and destroy work without layout support', () => {
    const v = createItemView(makeWord('Na-se'), () => {});
    expect(() => { v.reset(); v.destroy(); }).not.toThrow();
  });

  describe('pointer wiring', () => {
    const identity = { inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) };

    class FakePoint {
      constructor(public x: number, public y: number) {}
      matrixTransform(m: { a: number; b: number; c: number; d: number; e: number; f: number }) {
        return { x: m.a * this.x + m.c * this.y + m.e, y: m.b * this.x + m.d * this.y + m.f };
      }
    }
    beforeEach(() => { vi.stubGlobal('DOMPoint', FakePoint); });
    afterEach(() => { vi.unstubAllGlobals(); });

    function setup(captureThrows = false) {
      const onComplete = vi.fn();
      const v = createItemView(makeWord('Ma'), onComplete);
      (v.el as unknown as { getScreenCTM: () => unknown }).getScreenCTM = () => identity;
      (v.el as unknown as { setPointerCapture: () => void }).setPointerCapture = () => {
        if (captureThrows) throw new Error('capture failed');
      };
      const handle = v.el.querySelector('g.handle')!;
      const fire = (type: string, x: number, y: number, pointerId = 1) => {
        const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
        Object.defineProperty(e, 'pointerId', { value: pointerId });
        v.el.dispatchEvent(e);
        return e;
      };
      const start = { x: 0, y: 0 };
      const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(handle.getAttribute('transform')!)!;
      start.x = Number(m[1]);
      start.y = Number(m[2]);
      return { v, onComplete, handle, fire, start };
    }

    it('drags the handle along the arc and completes once', () => {
      const { onComplete, handle, fire, start } = setup();
      const before = handle.getAttribute('transform');
      const down = fire('pointerdown', start.x, start.y);
      expect(down.defaultPrevented).toBe(true);
      fire('pointermove', start.x + 100, start.y);
      expect(handle.getAttribute('transform')).not.toBe(before);
      expect(onComplete).not.toHaveBeenCalled();
      fire('pointermove', 5000, start.y);
      fire('pointerup', 5000, start.y);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('ignores moves of a different pointer', () => {
      const { handle, fire, start } = setup();
      fire('pointerdown', start.x, start.y, 1);
      const before = handle.getAttribute('transform');
      fire('pointermove', start.x + 100, start.y, 2);
      expect(handle.getAttribute('transform')).toBe(before);
    });

    it('still drags when setPointerCapture throws', () => {
      const { onComplete, fire, start } = setup(true);
      const down = fire('pointerdown', start.x, start.y);
      expect(down.defaultPrevented).toBe(true);
      fire('pointermove', 5000, start.y);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('releases the drag on lostpointercapture', () => {
      const { handle, fire, start } = setup();
      fire('pointerdown', start.x, start.y);
      fire('lostpointercapture', start.x, start.y);
      const before = handle.getAttribute('transform');
      fire('pointermove', start.x + 100, start.y);
      expect(handle.getAttribute('transform')).toBe(before);
      fire('pointerdown', start.x, start.y);
      fire('pointermove', start.x + 100, start.y);
      expect(handle.getAttribute('transform')).not.toBe(before);
    });
  });
});
