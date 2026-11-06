import { describe, expect, it } from 'vitest';
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
});
