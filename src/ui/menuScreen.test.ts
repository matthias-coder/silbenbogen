import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { availableAreas } from '../domain/areas';
import { mountMenuScreen } from './menuScreen';

describe('mountMenuScreen', () => {
  let root: HTMLElement;
  let unmount: () => void;
  const q = (id: string) => root.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    document.body.appendChild(root);
  });
  afterEach(() => {
    unmount();
    root.remove();
    vi.useRealTimers();
  });

  it('shows one tile per area and reports the picked area', () => {
    const onPick = vi.fn();
    const areas = availableAreas([1, 3, 5]);
    unmount = mountMenuScreen(root, { areas, onPick, onOpenParent: vi.fn() });
    expect([...root.querySelectorAll('.area-title')].map((e) => e.textContent)).toEqual([
      'Silben',
      'Kurze Wörter',
      'Buchstabengruppen',
      'Alles gemischt',
    ]);
    q('area-kurz')!.click();
    expect(onPick).toHaveBeenCalledWith(areas[1]);
  });

  it('opens the parent area after holding the gear for 3 seconds', () => {
    const onOpenParent = vi.fn();
    unmount = mountMenuScreen(root, { areas: availableAreas([1]), onPick: vi.fn(), onOpenParent });
    q('gear')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(3000);
    expect(onOpenParent).toHaveBeenCalledOnce();
  });

  it('shows a hint when no area is available', () => {
    unmount = mountMenuScreen(root, { areas: [], onPick: vi.fn(), onOpenParent: vi.fn() });
    expect(q('empty')!.textContent).toBe('Im Elternbereich Buchstaben auswählen.');
  });

  it('shows a notice for 2.5 seconds', () => {
    unmount = mountMenuScreen(root, {
      areas: availableAreas([1]), onPick: vi.fn(), onOpenParent: vi.fn(), notice: 'Gespeichert',
    });
    expect(q('notice')!.textContent).toBe('Gespeichert');
    vi.advanceTimersByTime(2500);
    expect(q('notice')).toBeNull();
  });
});
