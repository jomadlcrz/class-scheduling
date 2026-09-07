import { AnimatePresence, motion, useDragControls } from "motion/react";
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

const SHEET_TRANSITION = {
  duration: 0.25,
  ease: [0.32, 0.72, 0, 1] as const,
};

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className = "",
}: BottomSheetProps) {
  const dragControls = useDragControls();

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
          {/* Backdrop Overlay - Pure alpha for zero-lag hardware compositing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-950/50 will-change-opacity"
            aria-hidden="true"
          />

          {/* Bottom Sheet Modal Drawer - Hardware accelerated */}
          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.75 }}
            dragSnapToOrigin
            onDragEnd={(_e, info) => {
              if (info.offset.y > 80 || info.velocity.y > 300) {
                onClose();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SHEET_TRANSITION}
            className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-slate-200/80 bg-white shadow-2xl will-change-transform dark:border-white/10 dark:bg-surface ${className}`}
            role="dialog"
            aria-modal="true"
          >
            {/* Pull / Drag Indicator Handle Bar */}
            <div
              onPointerDown={(e) => dragControls.start(e, { snapToCursor: false })}
              className="flex w-full cursor-grab active:cursor-grabbing items-center justify-center pt-3 pb-2 touch-none select-none"
              role="button"
              tabIndex={0}
              aria-label="Drag down to close sheet"
            >
              <div className="h-1.5 w-12 rounded-full bg-slate-300 transition-colors hover:bg-slate-400 dark:bg-white/20 dark:hover:bg-white/40" />
            </div>

            {/* Sheet Header — Also draggable for effortless reachability */}
            {(title || subtitle) && (
              <div
                onPointerDown={(e) => dragControls.start(e, { snapToCursor: false })}
                className="cursor-grab active:cursor-grabbing px-5 pt-1 pb-3 touch-none select-none"
              >
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

            {/* Scrollable Content Body — Normal scroll with zero gesture conflicts */}
            <div className="flex-1 overflow-y-auto px-5 py-2 overscroll-contain no-scrollbar">
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
