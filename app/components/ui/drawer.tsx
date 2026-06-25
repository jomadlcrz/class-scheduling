import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./icons";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
};

/** Right-side off-canvas sheet. Mirrors the mobile-nav drawer animation/behavior. */
export function Drawer({ open, onClose, title, description, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <DrawerPanel key="drawer" onClose={onClose} title={title} description={description}>
          {children}
        </DrawerPanel>
      )}
    </AnimatePresence>
  );
}

function DrawerPanel({
  onClose,
  title,
  description,
  children,
}: {
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  // Freeze body scroll while open; the panel scrolls internally.
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-navy-950/40"
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
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-navy-900"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-white/8">
          <div>
            <h2 className="font-display text-2xl tracking-wide text-navy-700 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-1 font-sans text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </motion.aside>
    </>
  );
}
