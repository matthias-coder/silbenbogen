import { arcPoint, type ItemLayout } from './arc';

export const GRAB_RADIUS = 75, SNAP_AT = 0.97;

export interface TraceState { current: number; t: number[]; complete: boolean; }

export class TraceController {
  private s: TraceState;
  private pointer: number | null = null;
  private canSnap = true;

  constructor(
    private readonly layout: ItemLayout,
    private readonly onChange: (s: TraceState) => void,
    private readonly onComplete: () => void,
    private readonly grabRadius = GRAB_RADIUS,
  ) {
    this.s = this.fresh();
  }

  get state(): TraceState {
    return { current: this.s.current, t: [...this.s.t], complete: this.s.complete };
  }

  private fresh(): TraceState {
    return { current: 0, t: this.layout.syllables.map(() => 0), complete: false };
  }

  /**
   * Grabs the handle of the current arc. While that arc is untouched, the end
   * handle of the previous arc can be grabbed too, so finished arcs can always
   * be dragged back. The closer handle wins.
   */
  down(pointerId: number, x: number, y: number): boolean {
    if (this.pointer !== null) return false;
    const cur = this.s.current;
    const dist = (i: number, t: number) => {
      const p = arcPoint(this.layout.syllables[i], t);
      return Math.hypot(x - p.x, y - p.y);
    };
    let pick = cur;
    let best = dist(cur, this.s.t[cur]);
    if (cur > 0 && this.s.t[cur] === 0) {
      const d = dist(cur - 1, 1);
      if (d < best) {
        pick = cur - 1;
        best = d;
      }
    }
    if (best > this.grabRadius) return false;
    this.pointer = pointerId;
    this.canSnap = this.s.t[pick] < SNAP_AT;
    if (pick !== cur) {
      this.s.current = pick;
      this.onChange(this.state);
    }
    return true;
  }

  move(pointerId: number, x: number, y?: number): void {
    if (pointerId !== this.pointer) return;
    let i = this.s.current;
    let switched = false;
    const raw = (k: number) => {
      const syl = this.layout.syllables[k];
      return (x - syl.x0) / (syl.x1 - syl.x0);
    };
    if (raw(i) < 0 && i > 0 && y !== undefined) {
      const end = arcPoint(this.layout.syllables[i - 1], 1);
      if (Math.hypot(x - end.x, y - end.y) <= this.grabRadius) {
        this.s.t[i] = 0;
        i = this.s.current = i - 1;
        this.canSnap = false;
        switched = true;
      }
    }
    let t = Math.min(Math.max(raw(i), 0), 1);
    if (t < SNAP_AT) this.canSnap = true;
    else t = 1;
    const snapped = this.canSnap && t === 1;
    if (t === this.s.t[i] && !snapped && !switched) return;
    this.s.t[i] = t;
    if (t < 1) this.s.complete = false;
    if (snapped) {
      this.pointer = null;
      if (i === this.layout.syllables.length - 1) this.s.complete = true;
      else this.s.current = i + 1;
    }
    this.onChange(this.state);
    if (snapped && this.s.complete) this.onComplete();
  }

  up(pointerId: number): void {
    if (pointerId === this.pointer) this.pointer = null;
  }

  cancel(pointerId: number): void {
    this.up(pointerId);
  }

  reset(): void {
    this.s = this.fresh();
    this.pointer = null;
    this.onChange(this.state);
  }
}
