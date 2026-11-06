import { arcPoint, type ItemLayout } from './arc';

export const GRAB_RADIUS = 75, SNAP_AT = 0.97;

export interface TraceState { current: number; t: number[]; complete: boolean; }

export class TraceController {
  private s: TraceState;
  private pointer: number | null = null;

  constructor(
    private readonly layout: ItemLayout,
    private readonly onChange: (s: TraceState) => void,
    private readonly onComplete: () => void,
  ) {
    this.s = this.fresh();
  }

  get state(): TraceState {
    return { current: this.s.current, t: [...this.s.t], complete: this.s.complete };
  }

  private fresh(): TraceState {
    return { current: 0, t: this.layout.syllables.map(() => 0), complete: false };
  }

  down(pointerId: number, x: number, y: number): boolean {
    if (this.s.complete || this.pointer !== null) return false;
    const syl = this.layout.syllables[this.s.current];
    const h = arcPoint(syl, this.s.t[this.s.current]);
    if (Math.hypot(x - h.x, y - h.y) > GRAB_RADIUS) return false;
    this.pointer = pointerId;
    return true;
  }

  move(pointerId: number, x: number): void {
    if (pointerId !== this.pointer) return;
    const i = this.s.current;
    const syl = this.layout.syllables[i];
    let t = Math.min(Math.max((x - syl.x0) / (syl.x1 - syl.x0), 0), 1);
    const snapped = t >= SNAP_AT;
    if (snapped) t = 1;
    if (t === this.s.t[i] && !snapped) return;
    this.s.t[i] = t;
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
