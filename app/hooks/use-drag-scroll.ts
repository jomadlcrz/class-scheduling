import { useEffect, type RefObject } from "react";

export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let savedLeft = 0;

    const down = (e: MouseEvent) => {
      isDown = true;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
      startX = e.pageX - el.offsetLeft;
      savedLeft = el.scrollLeft;
    };
    const end = () => {
      isDown = false;
      el.style.cursor = "grab";
      el.style.userSelect = "";
    };
    const move = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      el.scrollLeft = savedLeft - (e.pageX - el.offsetLeft - startX) * 1.5;
    };

    el.addEventListener("mousedown", down);
    el.addEventListener("mouseleave", end);
    el.addEventListener("mouseup", end);
    el.addEventListener("mousemove", move);
    return () => {
      el.removeEventListener("mousedown", down);
      el.removeEventListener("mouseleave", end);
      el.removeEventListener("mouseup", end);
      el.removeEventListener("mousemove", move);
    };
  }, [ref]);
}
