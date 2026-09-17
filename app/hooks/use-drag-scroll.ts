import { useEffect, type RefObject } from "react";

export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.cursor = "grab";

    let isDown = false;
    let isDragging = false;
    let startX = 0;
    let savedLeft = 0;
    let targetLeft = 0;
    let rafId: number | null = null;

    const render = () => {
      if (el && isDown) {
        el.scrollLeft = targetLeft;
      }
      rafId = null;
    };

    const onMouseDown = (e: MouseEvent) => {
      // Primary left button (0) or middle button (1) only
      if (e.button !== 0 && e.button !== 1) return;

      const target = e.target as Element | null;
      // Ignore click on interactive items marked to ignore drag
      if (target?.closest("[data-drag-scroll-ignore]")) return;
      if (target?.closest("input, select, textarea")) return;

      // Shift + left click belongs to timetable range selection
      if (e.shiftKey && e.button === 0) return;

      isDown = true;
      isDragging = false;
      startX = e.clientX;
      savedLeft = el.scrollLeft;
      targetLeft = savedLeft;

      window.addEventListener("mousemove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;

      const dx = e.clientX - startX;

      // Small threshold to separate normal clicks from a drag gesture
      if (!isDragging && Math.abs(dx) > 3) {
        isDragging = true;
        el.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
      }

      if (isDragging) {
        e.preventDefault();
        // Pure 1:1 horizontal scroll tracking
        targetLeft = savedLeft - dx;
        if (rafId === null) {
          rafId = requestAnimationFrame(render);
        }
      }
    };

    const onMouseUp = () => {
      if (!isDown) return;

      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        if (el) el.scrollLeft = targetLeft;
      }

      if (isDragging) {
        // Intercept any click event fired immediately following a drag
        const captureClick = (e: MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          window.removeEventListener("click", captureClick, true);
        };
        window.addEventListener("click", captureClick, true);
        setTimeout(() => {
          window.removeEventListener("click", captureClick, true);
        }, 80);
      }

      isDown = false;
      isDragging = false;
      el.style.cursor = "grab";
      document.body.style.userSelect = "";
    };

    el.addEventListener("mousedown", onMouseDown);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [ref]);
}
