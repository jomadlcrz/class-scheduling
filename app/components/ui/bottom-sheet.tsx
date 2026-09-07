import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  snapPoints?: string[]; // e.g. ["70%", "92%"]
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className = "",
}: BottomSheetProps) {
  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-center">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-950/45 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Bottom Sheet Modal Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-surface ${className}`}
            role="dialog"
            aria-modal="true"
          >
            {/* Pull / Drag Indicator */}
            <div className="flex w-full items-center justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/20" />
            </div>

            {/* Sheet Header */}
            {(title || subtitle) && (
              <div className="px-5 pt-2 pb-3">
                {title && (
                  <h3 className="font-heading text-lg font-bold tracking-tight text-navy-700 dark:text-mist-100">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-5 py-2 no-scrollbar">
              {children}
            </div>

            {/* Sheet Footer */}
            {footer && (
              <div className="border-t border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-surface">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
