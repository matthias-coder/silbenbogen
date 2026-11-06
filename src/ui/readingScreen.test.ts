import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { randomSyllables } from '../domain/pool';
import { mulberry32 } from '../testing/rng';
import { mountReadingScreen } from './readingScreen';

const pool = () => randomSyllables(1, new Set(['m', 'a', 'e', 'i', 'o', 'u']));

describe('mountReadingScreen', () => {
  let root: HTMLElement;
  let onOpenParent: Mock<() => void>;
  let unmount: () => void;
  const q = (id: string) => root.querySelector(`[data-testid="${id}"]`) as HTMLElement;

  beforeEach(() => {
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
  });

  it('shows one item, ten empty dots and the next button', () => {
    expect(q('item').querySelectorAll('svg')).toHaveLength(1);
    expect(q('dots').children).toHaveLength(10);
    expect(q('dots').querySelectorAll('.on')).toHaveLength(0);
    expect(q('next').textContent).toBe('Weiter');
    expect(q('done')).toBeNull();
  });

  it('counts completed tasks, ends after ten and restarts with Nochmal', () => {
    q('next').click();
    expect(q('dots').querySelectorAll('.on')).toHaveLength(1);
    for (let i = 0; i < 9; i++) q('next').click();
    expect(q('done').textContent).toContain('Geschafft!');
    expect(q('item')).toBeNull();
    expect(q('dots').querySelectorAll('.on')).toHaveLength(10);
    q('again').click();
    expect(q('done')).toBeNull();
    expect(q('dots').querySelectorAll('.on')).toHaveLength(0);
    expect(q('item').querySelectorAll('svg')).toHaveLength(1);
  });

  it('prevents the context menu', () => {
    const ev = new Event('contextmenu', { bubbles: true, cancelable: true });
    q('gear').dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('opens the parent area only after a 3 second long press', () => {
    q('gear').click();
    q('gear').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(2999);
    expect(onOpenParent).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onOpenParent).toHaveBeenCalledTimes(1);
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
});
