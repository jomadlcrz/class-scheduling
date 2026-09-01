import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "~/components/ui/icons";
import { useOverlayDepth, getTopOverlayDepth } from "~/components/ui/modal";
import { useScrollLock } from "~/hooks/use-scroll-lock";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Wider panel for content that needs room (e.g. side-by-side layouts). */
  wide?: boolean;
  /** Override z-index (default 50). Use higher values when opening from inside a Modal. */
  zIndex?: number;
  /** Pinned action bar rendered in a distinct footer band below the body. */
  footer?: ReactNode;
  children: ReactNode;
};

/** Right-side off-canvas sheet. Mirrors the mobile-nav drawer animation/behavior. */
export function Drawer({ open, onClose, title, description, wide, zIndex, footer, children }: DrawerProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <DrawerPanel key="drawer" onClose={onClose} title={title} description={description} wide={wide} zIndex={zIndex} footer={footer}>
          {children}
        </DrawerPanel>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function DrawerPanel({
  onClose,
  title,
  description,
  wide,
  zIndex,
  footer,
  children,
}: {
  onClose: () => void;
  title: string;
  description?: string;
  wide?: boolean;
  zIndex?: number;
  footer?: ReactNode;
  children: ReactNode;
}) {
  // Freeze body scroll while open; the panel scrolls internally.
  useScrollLock();

  // Share depth tracking with Modals so only the top-most overlay closes on Escape.
  const depth = useOverlayDepth();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Escape closes only the top-most overlay, leaving the opener untouched.
      if (e.key === "Escape" && depth >= getTopOverlayDepth()) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, depth]);

  const backdropZ = zIndex ?? 50;
  const panelZ = backdropZ;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 h-dvh w-dvw bg-navy-950/40"
        style={{ zIndex: backdropZ }}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className={`fixed right-0 top-0 flex h-dvh w-full flex-col overflow-x-hidden bg-white shadow-2xl dark:bg-surface-raised ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
        style={{ zIndex: panelZ }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 dark:border-white/10 dark:bg-white/5">
          <div>
            <h2 className="min-w-0 font-display text-lg tracking-wide text-navy-700 sm:text-xl dark:text-mist-100">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 font-body text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-mist-100"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="scrollbar-thin min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-white/8 dark:bg-white/5">
            {footer}
          </div>
        )}
      </motion.aside>
    </>
  );
}
