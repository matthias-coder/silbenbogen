import { describe, expect, it } from 'vitest';
import { activeBox, arcPoint, arcPath, colorAt, layoutItem } from './arc';

describe('layoutItem', () => {
  it('lays out boxes, arcs and colors', () => {
    const ma = layoutItem([['M', 'a']]);
    expect(ma.width).toBe(306);
    expect(ma.height).toBe(330);
    expect(ma.syllables[0].boxes.map((b) => [b.x, b.w])).toEqual([[30, 110], [166, 110]]);
    expect([ma.syllables[0].x0, ma.syllables[0].x1]).toEqual([85, 221]);
    expect(ma.syllables[0].depth).toBeCloseTo(57.12);
    expect(layoutItem([['Sch', 'u']]).syllables[0].boxes[0].w).toBe(214);
    expect(layoutItem([['N', 'a'], ['s', 'e']]).syllables[1].boxes[0].x).toBe(346);
    expect(layoutItem([['N', 'a'], ['s', 'e']]).width).toBe(622);
    const oma = layoutItem([['O'], ['m', 'a']]).syllables[0];
    expect([oma.x0, oma.x1]).toEqual([50, 120]);
    expect(oma.boxes[0].color).toBe('rgb(230,57,139)');
    expect(layoutItem([['M', 'u', 't']]).syllables[0].boxes.map((b) => b.color)).toEqual([
      'rgb(230,57,139)',
      'rgb(139,63,181)',
      'rgb(47,127,214)',
    ]);
  });
});

describe('arc geometry', () => {
  const s = layoutItem([['M', 'a']]).syllables[0];
  it('computes points and paths', () => {
    expect(arcPoint(s, 0)).toEqual({ x: 85, y: 170 });
    expect(arcPoint(s, 1)).toEqual({ x: 221, y: 170 });
    expect(arcPoint(s, 0.5).x).toBe(153);
    expect(arcPoint(s, 0.5).y).toBeCloseTo(170 + 57.12);
    expect(arcPath(s, 0.5, 0.5)).toBe('');
    expect(arcPath(s, 0, 1).startsWith('M85,170')).toBe(true);
  });
});

describe('colors', () => {
  it('interpolates stops', () => {
    expect(colorAt(0, 2)).toBe('rgb(230,57,139)');
    expect(colorAt(1, 2)).toBe('rgb(139,63,181)');
    expect(colorAt(0.5, 3)).toBe('rgb(139,63,181)');
    expect(colorAt(1, 3)).toBe('rgb(47,127,214)');
    expect(colorAt(1, 4)).toBe('rgb(20,160,150)');
    expect(colorAt(1, 7)).toBe('rgb(20,160,150)');
    expect(colorAt(0.5, 1)).toBe('rgb(230,57,139)');
  });
  it('picks the active box', () => {
    expect([activeBox(0.49, 2), activeBox(0.5, 2), activeBox(0.3, 3), activeBox(1, 3)]).toEqual([0, 1, 1, 2]);
  });
});
