import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { countByStage } from '../domain/pool';
import { emptyProgress, recordOutcome, type Progress } from '../domain/progress';
import type { Stage } from '../domain/types';
import { DEFAULT_SETTINGS } from '../storage/settings';
import { mountMenuScreen } from './menuScreen';

const KNOWN = new Set([...DEFAULT_SETTINGS.known, 'r']);

describe('mountMenuScreen', () => {
  let root: HTMLElement;
  let unmount: () => void;
  let onPick: Mock<(s: Stage[]) => void>;
  let onOpenAlbum: Mock<() => void>;
  let onOpenParent: Mock<() => void>;
  const q = (id: string) => root.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  const mount = (o: { known?: Set<string>; progress?: Progress; name?: string; notice?: string } = {}) => {
    unmount?.();
    unmount = mountMenuScreen(root, {
      known: o.known ?? KNOWN,
      progress: o.progress ?? emptyProgress(),
      name: o.name ?? '',
      notice: o.notice,
      onPick,
      onOpenAlbum,
      onOpenParent,
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    document.body.appendChild(root);
    onPick = vi.fn();
    onOpenAlbum = vi.fn();
    onOpenParent = vi.fn();
    mount();
  });
  afterEach(() => {
    unmount();
    root.remove();
    vi.useRealTimers();
  });

  it('lists six stages with labels and counts', () => {
    const counts = countByStage(KNOWN);
    for (let s = 1; s <= 6; s++) expect(q(`stage-${s}`)).not.toBeNull();
    expect(q('stage-1')!.textContent).toContain('Mitlaut + Selbstlaut (Ma, Se)');
    expect(q('stage-1')!.textContent).toContain(`${counts[1]} Silben`);
    expect(q('stage-3')!.textContent).toContain(`${counts[3]} Wörter`);
  });

  it('starts a stage on tap', () => {
    q('stage-1')!.click();
    expect(onPick).toHaveBeenCalledWith([1]);
  });

  it('greys out a stage without tasks, shows the reason and ignores taps', () => {
    const row = q('stage-5')!;
    expect(row.classList.contains('off')).toBe(true);
    expect(row.getAttribute('aria-disabled')).toBe('true');
    expect(row.textContent).toContain('Dafür fehlt eine Buchstabengruppe (z. B. Sch, Ei, Au).');
    expect(row.textContent).toContain('0 Wörter');
    row.click();
    expect(onPick).not.toHaveBeenCalled();
  });

  it('shows the progress line per stage', () => {
    const total = countByStage(KNOWN)[1];
    expect(q('stage-1')!.textContent).toContain('noch nicht geübt');
    let p = emptyProgress();
    for (let n = 0; n < 3; n++) p = recordOutcome(p, 'silbe-ma', 'first').progress;
    mount({ progress: p });
    expect(q('stage-1')!.textContent).toContain(`1 von ${total} sicher`);
  });

  it('greets by name only when a name is set', () => {
    expect(q('greeting')).toBeNull();
    mount({ name: 'Lena' });
    expect(q('greeting')!.textContent).toBe('Hallo Lena!');
  });

  it('offers "Alles gemischt" only with two or more available stages', () => {
    const counts = countByStage(KNOWN);
    const available = ([1, 2, 3, 4, 5, 6] as Stage[]).filter((s) => counts[s] > 0);
    q('mixed')!.click();
    expect(q('mixed')!.textContent).toBe('Alles gemischt');
    expect(onPick).toHaveBeenCalledWith(available);
    const single = new Set(['b', 'a']);
    expect(Object.values(countByStage(single)).filter((n) => n > 0)).toHaveLength(1);
    mount({ known: single });
    expect(q('mixed')).toBeNull();
  });

  it('opens the album', () => {
    expect(q('album')!.textContent).toContain('Meine Wörter');
    q('album')!.click();
    expect(onOpenAlbum).toHaveBeenCalledOnce();
  });

  it('opens the parent area after holding the gear for 3 seconds', () => {
    q('gear')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(2999);
    expect(onOpenParent).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onOpenParent).toHaveBeenCalledOnce();
  });

  it('shows a notice for 2.5 seconds', () => {
    mount({ notice: 'Gespeichert' });
    expect(q('notice')!.textContent).toBe('Gespeichert');
    vi.advanceTimersByTime(2500);
    expect(q('notice')).toBeNull();
  });
});
