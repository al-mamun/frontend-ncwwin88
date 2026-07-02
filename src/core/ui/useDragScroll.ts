'use client';

import { useCallback, useRef } from 'react';

/**
 * Attach horizontal DRAG-TO-SCROLL to an overflow-x row (e.g. the featured
 * provider tabs) so long lists are reachable on DESKTOP with click+drag. Touch
 * devices keep native swipe (we only engage manual drag for a mouse pointer).
 * Returns a callback ref to spread onto the scrollable element.
 */
export function useDragScroll<T extends HTMLElement>() {
  const cleanup = useRef<(() => void) | undefined>(undefined);
  return useCallback((el: T | null) => {
    cleanup.current?.();
    cleanup.current = undefined;
    if (!el) return;
    let down = false, startX = 0, startScroll = 0, moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return; // touch => native scroll
      down = true; moved = false; startX = e.clientX; startScroll = el.scrollLeft;
      el.classList.add('is-dragging');
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const onUp = () => { if (!down) return; down = false; el.classList.remove('is-dragging'); };
    // Swallow the click that ends a drag so a tab isn\'t accidentally selected.
    const onClick = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClick, true);
    cleanup.current = () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClick, true);
    };
  }, []);
}
