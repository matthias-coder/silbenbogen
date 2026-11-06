import { beforeEach, describe, expect, it } from 'vitest';
import { arcPoint, layoutItem } from './arc';
import { TraceController } from './trace';

describe('TraceController', () => {
  const nase = layoutItem([['N', 'a'], ['s', 'e']]);
  let changes = 0;
  let completes = 0;
  beforeEach(() => {
    changes = 0;
    completes = 0;
  });

  it('runs a full trace', () => {
    const c = new TraceController(nase, () => changes++, () => completes++);
    expect(c.down(1, 300, 170)).toBe(false);
    c.move(1, 200);
    expect(c.state.t[0]).toBe(0);
    expect(c.down(1, 90, 175)).toBe(true);
    c.move(1, 153);
    expect(c.state.t[0]).toBeCloseTo(0.5);
    c.move(1, 119);
    expect(c.state.t[0]).toBeCloseTo(0.25);
    c.move(2, 221);
    expect(c.state.t[0]).toBeCloseTo(0.25);
    expect(c.down(2, 119, 200)).toBe(false);
    c.cancel(1);
    c.move(1, 221);
    expect(c.state.t[0]).toBeCloseTo(0.25);
    const p = arcPoint(nase.syllables[0], 0.25);
    expect(c.down(3, p.x, p.y)).toBe(true);
    c.move(3, 218);
    expect(c.state.t[0]).toBe(1);
    expect(c.state.current).toBe(1);
    expect(c.state.complete).toBe(false);
    c.move(3, 500);
    expect(c.state.t[1]).toBe(0);
    expect(c.down(4, 401, 170)).toBe(true);
    c.move(4, 600);
    expect(c.state.complete).toBe(true);
    expect(completes).toBe(1);
    expect(c.down(5, 537, 170)).toBe(false);
    c.move(4, 537);
    expect(completes).toBe(1);
    expect(changes).toBeGreaterThan(0);
    c.reset();
    expect(c.state).toEqual({ current: 0, t: [0, 0], complete: false });
  });

  it('exposes state as a copy', () => {
    const c = new TraceController(nase, () => {}, () => {});
    c.state.t[0] = 1;
    c.state.complete = true;
    expect(c.state).toEqual({ current: 0, t: [0, 0], complete: false });
  });

  it('grabs within a custom radius and not beyond', () => {
    const ma = layoutItem([['M', 'a']]);
    const c = new TraceController(ma, () => {}, () => {}, 120);
    expect(c.down(1, 85 + 121, 170)).toBe(false);
    expect(c.down(1, 85 + 119, 170)).toBe(true);
    const d = new TraceController(ma, () => {}, () => {});
    expect(d.down(1, 85 + 119, 170)).toBe(false);
  });
});
