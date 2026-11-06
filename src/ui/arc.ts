import type { Syllable } from '../domain/types';

export const BOX_W = 110, BOX_H = 120, BOX_EXTRA = 52, BOX_GAP = 26, SYL_GAP = 70, PAD = 30, BOX_Y = 20, ARC_Y = 170, VIEW_H = 330, SINGLE_INSET = 20;
export const COLORS = ['#e6398b', '#8b3fb5', '#2f7fd6', '#14a096'];

export interface BoxLayout { x: number; w: number; text: string; color: string; }
export interface SyllableLayout { boxes: BoxLayout[]; x0: number; x1: number; depth: number; }
export interface ItemLayout { width: number; height: number; syllables: SyllableLayout[]; }

export function colorStops(n: number): string[] {
  return COLORS.slice(0, Math.min(Math.max(n, 1), 4));
}

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

export function colorAt(t: number, n: number): string {
  const stops = colorStops(n).map(hexToRgb);
  const pos = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
  const i = Math.min(Math.floor(pos), stops.length - 1);
  const j = Math.min(i + 1, stops.length - 1);
  const f = pos - i;
  const c = stops[i].map((v, k) => Math.round(v + (stops[j][k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function activeBox(t: number, n: number): number {
  return Math.round(t * (n - 1));
}

export function layoutItem(syllables: Syllable[]): ItemLayout {
  let x = PAD;
  const out: SyllableLayout[] = [];
  syllables.forEach((syl, si) => {
    if (si > 0) x += SYL_GAP;
    const n = syl.length;
    const boxes: BoxLayout[] = syl.map((text, i) => {
      const w = BOX_W + BOX_EXTRA * (text.length - 1);
      const box = { x, w, text, color: colorAt(n > 1 ? i / (n - 1) : 0, n) };
      x += w + (i < n - 1 ? BOX_GAP : 0);
      return box;
    });
    const first = boxes[0];
    const last = boxes[boxes.length - 1];
    const x0 = boxes.length === 1 ? first.x + SINGLE_INSET : first.x + first.w / 2;
    const x1 = boxes.length === 1 ? first.x + first.w - SINGLE_INSET : last.x + last.w / 2;
    out.push({ boxes, x0, x1, depth: Math.min(110, 0.42 * (x1 - x0)) });
  });
  return { width: x + PAD, height: VIEW_H, syllables: out };
}

export function arcPoint(s: SyllableLayout, t: number): { x: number; y: number } {
  return { x: s.x0 + (s.x1 - s.x0) * t, y: ARC_Y + 4 * s.depth * t * (1 - t) };
}

export function arcAngle(s: SyllableLayout, t: number): number {
  const slope = (4 * s.depth * (1 - 2 * t)) / (s.x1 - s.x0);
  return (Math.atan(slope) * 180) / Math.PI;
}

const f = (v: number) => String(Math.round(v * 100) / 100);

/** Quadratic Bezier segment of the parabola between from and to. */
export function arcPath(s: SyllableLayout, from: number, to: number): string {
  if (to <= from) return '';
  const a = arcPoint(s, from);
  const b = arcPoint(s, to);
  const cx = (a.x + b.x) / 2;
  const cy = a.y + 2 * s.depth * (1 - 2 * from) * (to - from);
  return `M${f(a.x)},${f(a.y)} Q${f(cx)},${f(cy)} ${f(b.x)},${f(b.y)}`;
}
