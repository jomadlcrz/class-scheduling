import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type TooltipDirection = "right" | "left" | "top" | "bottom";

type TooltipProps = {
  label: string;
  direction?: TooltipDirection;
  /** Distance in px between the trigger and the bubble. */
  gap?: number;
  /** Suppress the tooltip (e.g. only show it while the sidebar is collapsed). */
  disabled?: boolean;
  children: ReactNode;
};

const ENTER_OFFSET: Record<TooltipDirection, string> = {
  right: "-translate-x-1",
  left: "translate-x-1",
  top: "translate-y-1",
  bottom: "-translate-y-1",
};

/**
 * Hover/focus tooltip rendered through a portal with fixed positioning, so it
 * escapes overflow-hidden containers (sidebar rail).
 */
export function Tooltip({
  label,
  direction = "bottom",
  gap = 8,
  disabled = false,
  children,
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (disabled) setVisible(false);
  }, [disabled]);

  // Position after the bubble mounts so its size can be measured; clamp to the viewport.
  useLayoutEffect(() => {
    if (!visible) {
      setPosition(null);
      return;
    }
    // The wrapper is display:contents, so measure the real trigger element inside it.
    const trigger = triggerRef.current?.firstElementChild ?? triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;

    const tr = trigger.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();
    const margin = 8;

    let top: number;
    let left: number;
    switch (direction) {
      case "right":
        top = tr.top + (tr.height - br.height) / 2;
        left = tr.right + gap;
        break;
      case "left":
        top = tr.top + (tr.height - br.height) / 2;
        left = tr.left - br.width - gap;
        break;
      case "top":
        top = tr.top - br.height - gap;
        left = tr.left + (tr.width - br.width) / 2;
        break;
      case "bottom":
        top = tr.bottom + gap;
        left = tr.left + (tr.width - br.width) / 2;
        break;
    }

    setPosition({
      top: Math.max(margin, Math.min(top, window.innerHeight - br.height - margin)),
      left: Math.max(margin, Math.min(left, window.innerWidth - br.width - margin)),
    });
  }, [visible, direction, gap, label]);

  function show() {
    if (!disabled) setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  return (
    <span
      ref={triggerRef}
      className="contents"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={bubbleRef}
            role="tooltip"
            style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
            className={`pointer-events-none fixed z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 font-body text-xs font-semibold text-slate-100 shadow-lg transition-[opacity,transform] duration-150 dark:bg-white dark:text-navy-900 ${
              position ? "translate-x-0 translate-y-0 opacity-100" : `opacity-0 ${ENTER_OFFSET[direction]}`
            }`}
          >
            {label}
          </div>,
          document.body,
        )}
    </span>
  );
}
