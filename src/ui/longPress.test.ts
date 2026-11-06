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
});
