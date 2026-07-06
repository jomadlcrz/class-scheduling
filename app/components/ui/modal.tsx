import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { FormError } from "../forms/form-error";
import { Button } from "./button";
import { CloseIcon } from "./icons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <ModalContent key="modal" onClose={onClose} title={title}>
          {children}
        </ModalContent>
      )}
    </AnimatePresence>
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
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="flex flex-col gap-4">
        <FormError message={error} />
        <div className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {children}
        </div>
        <div className="flex justify-end gap-2">
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
        </div>
      </div>
    </Modal>
  );
}

function ModalContent({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
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

  // Escape is intentionally NOT wired — modal closes only via its own buttons.

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-40 bg-navy-950/40"
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="pointer-events-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-xl border border-slate-300 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-navy-900"
        >
          <div className="flex shrink-0 items-start justify-between gap-4">
            <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>
          {/* -mx-6 px-6 keeps focus rings visible at the scroll pane edges. */}
          <div className="scrollbar-thin -mx-6 mt-4 overflow-y-auto px-6">{children}</div>
        </motion.div>
      </div>
    </>
  );
}
