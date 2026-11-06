/** Calls `onLongPress` after the pointer was held on `el` for `ms`; returns a detach function. */
export function attachLongPress(el: HTMLElement, ms: number, onLongPress: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const start = () => {
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      onLongPress();
    }, ms);
  };
  const cancelEvents = ['pointerup', 'pointercancel', 'pointerleave'] as const;
  el.addEventListener('pointerdown', start);
  for (const t of cancelEvents) el.addEventListener(t, cancel);
  return () => {
    cancel();
    el.removeEventListener('pointerdown', start);
    for (const t of cancelEvents) el.removeEventListener(t, cancel);
  };
}
