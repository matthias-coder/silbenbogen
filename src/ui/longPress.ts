export interface LongPressHooks { onStart?: () => void; onEnd?: () => void; }

/**
 * Calls `onLongPress` after the pointer was held on `el` for `ms`; returns a detach function.
 * `hooks.onStart` fires when a hold begins, `hooks.onEnd` once when it ends for any reason.
 */
export function attachLongPress(
  el: HTMLElement,
  ms: number,
  onLongPress: () => void,
  hooks?: LongPressHooks,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let holding = false;
  const end = () => {
    if (!holding) return;
    holding = false;
    hooks?.onEnd?.();
  };
  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    end();
  };
  const start = () => {
    cancel();
    holding = true;
    hooks?.onStart?.();
    timer = setTimeout(() => {
      timer = undefined;
      end();
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
