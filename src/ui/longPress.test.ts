import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { attachLongPress } from './longPress';

const ev = (type: string) => new Event(type, { bubbles: true });

describe('attachLongPress', () => {
  let el: HTMLElement;
  let cb: Mock<() => void>;
  beforeEach(() => {
    vi.useFakeTimers();
    el = document.createElement('button');
    cb = vi.fn();
  });
  afterEach(() => vi.useRealTimers());

  it('fires after the full duration only', () => {
    attachLongPress(el, 3000, cb);
    el.dispatchEvent(ev('pointerdown'));
    vi.advanceTimersByTime(2999);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not fire when released early', () => {
    attachLongPress(el, 3000, cb);
    el.dispatchEvent(ev('pointerdown'));
    vi.advanceTimersByTime(1000);
    el.dispatchEvent(ev('pointerup'));
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('does not fire when the pointer leaves or is cancelled', () => {
    attachLongPress(el, 3000, cb);
    el.dispatchEvent(ev('pointerdown'));
    el.dispatchEvent(ev('pointerleave'));
    vi.advanceTimersByTime(5000);
    el.dispatchEvent(ev('pointerdown'));
    el.dispatchEvent(ev('pointercancel'));
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('stops reacting after detach', () => {
    const detach = attachLongPress(el, 3000, cb);
    detach();
    el.dispatchEvent(ev('pointerdown'));
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });

  describe('hooks', () => {
    let onStart: Mock<() => void>;
    let onEnd: Mock<() => void>;
    beforeEach(() => {
      onStart = vi.fn();
      onEnd = vi.fn();
      attachLongPress(el, 3000, cb, { onStart, onEnd });
    });

    it('calls onStart on pointerdown and onEnd once when the hold fires', () => {
      el.dispatchEvent(ev('pointerdown'));
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onEnd).not.toHaveBeenCalled();
      vi.advanceTimersByTime(3000);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
      el.dispatchEvent(ev('pointerup'));
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it.each(['pointerup', 'pointerleave', 'pointercancel'])('calls onEnd once on %s', (type) => {
      el.dispatchEvent(ev('pointerdown'));
      el.dispatchEvent(ev(type));
      el.dispatchEvent(ev(type));
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('can be cancelled from outside: no fire, onEnd once', () => {
      const el2 = document.createElement('button');
      const detach = attachLongPress(el2, 3000, cb, { onStart, onEnd });
      el2.dispatchEvent(ev('pointerdown'));
      onEnd.mockClear();
      detach.cancel();
      vi.advanceTimersByTime(5000);
      el2.dispatchEvent(ev('pointerup'));
      expect(cb).not.toHaveBeenCalled();
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('calls onEnd once on detach during a hold', () => {
      const el2 = document.createElement('button');
      const detach = attachLongPress(el2, 3000, cb, { onStart, onEnd });
      el2.dispatchEvent(ev('pointerdown'));
      onEnd.mockClear();
      detach();
      detach();
      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });
});
