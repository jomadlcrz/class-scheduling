import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { CloseIcon } from "~/components/ui/icons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Wider panel for content that needs room (e.g. side-by-side layouts). */
  wide?: boolean;
  /** Full-width panel for data tables (e.g. audit logs). */
  xl?: boolean;
  /** Pinned action bar rendered in a distinct footer band below the body. */
  footer?: ReactNode;
  children: ReactNode;
};

export function Modal({ open, onClose, title, wide, xl, footer, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <ModalContent key="modal" onClose={onClose} title={title} wide={wide} xl={xl} footer={footer}>
          {children}
        </ModalContent>
      )}
    </AnimatePresence>
  );
}

/**
 * Bordered footer action row for modals that render their buttons inside the body
 * (forms especially, where the submit button must stay within the `<form>`). Full-bleeds
 * to the panel edges and matches the pinned `footer` band's border + tint, so every modal
 * gets the same header/footer framing whether or not it uses the `footer` prop.
 *
 * Must be the LAST child of the modal body — the negative margins cancel the body's
 * `px-4 py-4 sm:px-5` padding so the band sits flush to the panel's bottom and sides.
 */
export function ModalActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`-mx-4 -mb-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:-mx-5 sm:px-5 dark:border-white/10 dark:bg-white/5 ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  confirmLabel: string;
  loadingLabel: string;
  /** Button style for the confirm action; "danger" for destructive ones. */
  confirmVariant?: "primary" | "danger";
  onConfirm: () => Promise<void>;
  children: ReactNode;
};

/** Modal asking to confirm a single async action; owns loading/error state. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  confirmLabel,
  loadingLabel,
  confirmVariant = "primary",
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (isLoading) return;
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setError(null);
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button type="button" variant="outline" block={false} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            block={false}
            isLoading={isLoading}
            loadingLabel={loadingLabel}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormError message={error} />
        <div className="font-body text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {children}
        </div>
      </div>
    </Modal>
  );
}

function ModalContent({
  onClose,
  title,
  wide,
  xl,
  footer,
  children,
}: {
  onClose: () => void;
  title: string;
  wide?: boolean;
  xl?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  // Freeze body scroll while the modal is open; tall content scrolls
  // inside the panel instead (same pattern as the mobile nav drawer).
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
        className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Panel — top-aligned, not vertically centered; on small screens use nearly full viewport height so content scrolls inside. */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-2 pb-6 pt-6 sm:px-4 sm:pb-4 sm:pt-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`pointer-events-auto flex max-h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)] dark:border-white/10 dark:bg-surface-raised ${
            xl ? "max-w-5xl" : wide ? "max-w-3xl" : "max-w-md"
          }`}
        >
          {/* Header band */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="min-w-0 font-display text-lg tracking-wide text-navy-700 sm:text-xl dark:text-mist-100">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-mist-100"
            >
              <CloseIcon />
            </button>
          </div>
          {/* Body — scrolls when tall; its own padding keeps focus rings clear of the edges. */}
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {children}
          </div>
          {/* Footer band — pinned action bar, set apart from the body. */}
          {footer && (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 dark:border-white/10 dark:bg-white/5">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
