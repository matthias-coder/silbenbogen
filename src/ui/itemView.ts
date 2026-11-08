import type { Item } from '../domain/types';
import { BOX_H, activeBox, arcAngle, arcPath, arcPoint, chooseLayoutMode, colorAt, colorStops, fitScale, layoutItem } from './arc';
import { TraceController, type TraceState } from './trace';

const NS = 'http://www.w3.org/2000/svg';
const INACTIVE_COLOR = '#94949c';
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
let viewCounter = 0;

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}

export function createItemView(
  item: Item,
  onComplete: () => void,
  fit?: { width: number; height: number },
): { el: SVGSVGElement; reset(): void; destroy(): void } {
  const mode = fit ? chooseLayoutMode(item.syllables, fit.width, fit.height) : 'row';
  const layout = layoutItem(item.syllables, mode);
  const scale = fit ? fitScale(layout, fit.width, fit.height) : 1;
  const handleR = clamp(22 / scale, 28, 48);
  const grabRadius = Math.max(75, 40 / scale);
  const uid = `iv${viewCounter++}`;
  const el = svg('svg', { viewBox: `0 0 ${layout.width} ${layout.height}`, class: 'item-view' });
  if (fit) {
    el.setAttribute('width', String(layout.width * scale));
    el.setAttribute('height', String(layout.height * scale));
  }
  const defs = svg('defs', {}, el);

  const boxRects: SVGRectElement[][] = [];
  const progress: SVGPathElement[] = [];
  const handles: SVGGElement[] = [];
  const handleCircles: SVGCircleElement[] = [];
  const handleTriangles: SVGPathElement[] = [];

  layout.syllables.forEach((s, si) => {
    const n = s.boxes.length;
    const rects: SVGRectElement[] = [];
    s.boxes.forEach((b) => {
      rects.push(
        svg('rect', {
          class: 'box', x: b.x, y: b.y, width: b.w, height: BOX_H, rx: 8,
          fill: '#ffffff', 'stroke-width': 4, stroke: b.color,
        }, el),
      );
      const t = svg('text', {
        x: b.x + b.w / 2, y: s.y + 112, 'text-anchor': 'middle', 'font-size': 92,
        'font-family': 'Andika, sans-serif', fill: '#1d1d1f',
      }, el);
      t.textContent = b.text;
    });
    boxRects.push(rects);

    svg('path', {
      class: 'track', d: arcPath(s, 0, 1), fill: 'none', stroke: '#94949c',
      'stroke-width': 16, 'stroke-linecap': 'round',
    }, el);

    const gradId = `${uid}-g${si}`;
    const grad = svg('linearGradient', {
      id: gradId, gradientUnits: 'userSpaceOnUse', x1: s.x0, y1: 0, x2: s.x1, y2: 0,
    }, defs);
    const stops = colorStops(n);
    stops.forEach((c, i) => {
      svg('stop', { offset: stops.length > 1 ? i / (stops.length - 1) : 0, 'stop-color': c }, grad);
    });
    progress.push(
      svg('path', {
        class: 'progress', d: '', fill: 'none', stroke: `url(#${gradId})`,
        'stroke-width': 16, 'stroke-linecap': 'round',
      }, el),
    );
  });

  layout.syllables.forEach(() => {
    const g = svg('g', { class: 'handle' }, el);
    handleCircles.push(svg('circle', { r: handleR, fill: '#ffffff', 'stroke-width': 6 }, g));
    const arrow = svg('g', { transform: `scale(${handleR / 28})` }, g);
    handleTriangles.push(svg('path', { d: 'M-11 -12 L15 0 L-11 12 L-4 0 Z' }, arrow));
    handles.push(g);
  });

  function render(st: TraceState): void {
    layout.syllables.forEach((s, i) => {
      const n = s.boxes.length;
      const t = st.t[i];
      progress[i].setAttribute('d', arcPath(s, 0, t));
      const p = arcPoint(s, t);
      handles[i].setAttribute('transform', `translate(${p.x},${p.y}) rotate(${arcAngle(s, t)})`);
      const inactive = i > st.current;
      handles[i].classList.toggle('inactive', inactive);
      const color = inactive ? INACTIVE_COLOR : colorAt(t, n);
      handleCircles[i].setAttribute('stroke', color);
      handleTriangles[i].setAttribute('fill', color);
      const active = i === st.current ? activeBox(t, n) : -1;
      s.boxes.forEach((b, k) => {
        const r = boxRects[i][k];
        r.setAttribute('fill', k === active ? b.color : '#ffffff');
        r.setAttribute('fill-opacity', k === active ? '0.14' : '1');
      });
    });
  }

  const controller = new TraceController(layout, render, onComplete, grabRadius);

  function toView(e: PointerEvent): { x: number; y: number } | null {
    const ctm = el.getScreenCTM?.();
    if (!ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  }

  const onDown = (e: PointerEvent) => {
    const p = toView(e);
    if (p && controller.down(e.pointerId, p.x, p.y)) {
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {
        // capture is best effort; the drag works without it
      }
      e.preventDefault();
    }
  };
  const onMove = (e: PointerEvent) => {
    const p = toView(e);
    if (p) controller.move(e.pointerId, p.x, p.y);
  };
  const onUp = (e: PointerEvent) => controller.up(e.pointerId);
  const onCancel = (e: PointerEvent) => controller.cancel(e.pointerId);

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onCancel);
  el.addEventListener('lostpointercapture', onCancel);

  render(controller.state);

  return {
    el,
    reset: () => controller.reset(),
    destroy: () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('lostpointercapture', onCancel);
    },
  };
}
