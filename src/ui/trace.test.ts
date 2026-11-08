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

  const s0 = nase.syllables[0];
  const s1 = nase.syllables[1];
  const at = (s: typeof s0, t: number) => arcPoint(s, t);
  const traceAll = (c: TraceController) => {
    c.down(1, 90, 175);
    c.move(1, 221);
    const p = at(s1, 0);
    c.down(2, p.x, p.y);
    c.move(2, 600);
  };

  it('drags the last arc back after completion and completes again', () => {
    const c = new TraceController(nase, () => changes++, () => completes++);
    traceAll(c);
    expect(c.state.complete).toBe(true);
    const end = at(s1, 1);
    expect(c.down(3, end.x, end.y)).toBe(true);
    c.move(3, end.x);
    expect(c.state.complete).toBe(true);
    c.move(3, (s1.x0 + s1.x1) / 2);
    expect(c.state.t[1]).toBeCloseTo(0.5);
    expect(c.state.complete).toBe(false);
    expect(c.state.current).toBe(1);
    c.move(3, 600);
    expect(c.state.complete).toBe(true);
    expect(completes).toBe(2);
  });

  it('does not re-snap when grabbed at the end and jiggled there', () => {
    const c = new TraceController(nase, () => {}, () => completes++);
    traceAll(c);
    const end = at(s1, 1);
    c.down(3, end.x, end.y);
    c.move(3, end.x - 2);
    expect(c.state.t[1]).toBe(1);
    expect(c.state.complete).toBe(true);
    expect(completes).toBe(1);
    c.move(3, s1.x0);
    expect(c.state.t[1]).toBe(0);
  });

  it('grabs a finished syllable again by its end handle', () => {
    const c = new TraceController(nase, () => {}, () => {});
    c.down(1, 90, 175);
    c.move(1, 221);
    expect(c.state.current).toBe(1);
    const end = at(s0, 1);
    expect(c.down(2, end.x, end.y)).toBe(true);
    expect(c.state.current).toBe(0);
    c.move(2, (s0.x0 + s0.x1) / 2);
    expect(c.state.t[0]).toBeCloseTo(0.5);
    expect(c.state.t[1]).toBe(0);
    c.move(2, 600);
    expect(c.state.current).toBe(1);
    expect(c.state.t[0]).toBe(1);
  });

  it('does not offer the previous end while the current arc is started', () => {
    const c = new TraceController(nase, () => {}, () => {});
    c.down(1, 90, 175);
    c.move(1, 221);
    const p = at(s1, 0);
    c.down(2, p.x, p.y);
    c.move(2, (s1.x0 + s1.x1) / 2);
    c.up(2);
    const end = at(s0, 1);
    expect(c.down(3, end.x, end.y)).toBe(false);
  });

  it('continues back into the previous syllable within one drag', () => {
    const c = new TraceController(nase, () => {}, () => {});
    c.down(1, 90, 175);
    c.move(1, 221);
    const p = at(s1, 0.25);
    c.down(2, at(s1, 0).x, at(s1, 0).y);
    c.move(2, p.x);
    const back = at(s0, 0.9);
    c.move(2, back.x, back.y);
    expect(c.state.current).toBe(0);
    expect(c.state.t[1]).toBe(0);
    expect(c.state.t[0]).toBeCloseTo(0.9, 1);
  });
});
