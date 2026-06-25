import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type PopoverProps = {
  /** Accessible name for the trigger button. */
  label: string;
  /** Trigger button contents (e.g. an icon). */
  trigger: ReactNode;
  /** Classes for the trigger button. */
  triggerClassName?: string;
  /** Extra classes for the floating panel (e.g. width). */
  className?: string;
  /** Panel contents; receives a `close` helper to dismiss after a selection. */
  children: (close: () => void) => ReactNode;
};

const panelBase =
  "z-50 max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-navy-900";

/**
 * Anchored popover rendered in a portal so it escapes overflow/scroll clipping.
 * Positions under the trigger, flips above when there isn't room below, and
 * clamps inside the viewport — recomputing on scroll/resize.
 */
export function Popover({ label, trigger, triggerClassName, className, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const b = btnRef.current?.getBoundingClientRect();
      const m = menuRef.current?.getBoundingClientRect();
      if (!b || !m) return;
      const margin = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top = b.bottom + 6;
      if (top + m.height + margin > vh && b.top - 6 - m.height >= margin) {
        top = b.top - 6 - m.height; // flip above the trigger
      }
      top = Math.min(Math.max(top, margin), Math.max(margin, vh - m.height - margin));

      let left = b.right - m.width; // right-align the panel to the trigger
      left = Math.min(Math.max(left, margin), Math.max(margin, vw - m.width - margin));

      setPos({ top, left });
    };
    place();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              visibility: pos ? "visible" : "hidden",
            }}
            className={`${panelBase} ${className ?? ""}`}
          >
            {children(() => setOpen(false))}
          </div>,
          document.body,
        )}
    </>
  );
}
