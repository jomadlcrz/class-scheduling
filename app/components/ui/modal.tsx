import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { CloseIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useScrollLock } from "~/hooks/use-scroll-lock";

/** Overlays currently mounted. Each dialog reserves a slot so a nested dialog's
 *  backdrop + panel stack above every dialog opened before it. */
let openOverlayCount = 0;

/** Track depth for both Modals and Drawers so only the top-most closes on Escape. */
export function useOverlayDepth(): number {
  const [depth, setDepth] = useState(0);
  useEffect(() => {
    openOverlayCount += 1;
    setDepth(openOverlayCount);
    return () => {
      openOverlayCount -= 1;
    };
  }, []);
  return depth;
}

/** Read the current top-most overlay depth (for components that don't mount their own). */
export function getTopOverlayDepth(): number {
  return openOverlayCount;
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Wider panel for content that needs room (e.g. side-by-side layouts). */
  wide?: boolean;
  /** Full-width panel for data tables (e.g. audit logs). */
  xl?: boolean;
  /** Widest panel — for a full weekly timetable or full spreadsheet view. */
  full?: boolean;
  /** Stack above other fixed overlays. */
  elevated?: boolean;
  /** Prevent scroll chaining. */
  preventOverscroll?: boolean;
  /** Pinned action bar rendered in a distinct footer band below the body. */
  footer?: ReactNode;
  /** When true, omits the top-right X button. */
  hideCloseButton?: boolean;
  /** When true, ignores ESC and disables close actions. */
  disableClose?: boolean;
  children: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  wide,
  xl,
  full,
  elevated,
  preventOverscroll,
  footer,
  hideCloseButton,
  disableClose,
  children,
}: ModalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalContent
          key="modal"
          onClose={onClose}
          title={title}
          wide={wide}
          xl={xl}
          full={full}
          elevated={elevated}
          preventOverscroll={preventOverscroll}
          footer={footer}
          hideCloseButton={hideCloseButton}
          disableClose={disableClose}
        >
          {children}
        </ModalContent>
      )}
    </AnimatePresence>,
    document.body,
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
  /** When set, an input appears that must be typed exactly before confirm enables. */
  confirmationText?: string;
  /** Extra conditions that keep the confirm button disabled (e.g. invalid input). */
  confirmDisabled?: boolean;
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
  confirmationText,
  confirmDisabled = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typedConfirm, setTypedConfirm] = useState("");
  const confirmationInputId = useId();

  const confirmationMismatch =
    confirmationText !== undefined && typedConfirm !== confirmationText;

  function handleClose() {
    if (isLoading) return;
    setError(null);
    setTypedConfirm("");
    onClose();
  }

  async function handleConfirm() {
    setError(null);
    setIsLoading(true);
    try {
      await onConfirm();
      setTypedConfirm("");
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
            disabled={confirmDisabled || confirmationMismatch}
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
        {confirmationText !== undefined && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={confirmationInputId}>
              Type{" "}
              <span className="font-semibold text-navy-800 dark:text-mist-100">
                {confirmationText}
              </span>{" "}
              to confirm
            </Label>
            <input
              id={confirmationInputId}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={typedConfirm}
              onChange={(event) => setTypedConfirm(event.target.value)}
              className={inputClassName}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

function ModalContent({
  onClose,
  title,
  wide,
  xl,
  full,
  elevated,
  preventOverscroll,
  footer,
  hideCloseButton,
  disableClose,
  children,
}: {
  onClose: () => void;
  title: string;
  wide?: boolean;
  xl?: boolean;
  full?: boolean;
  elevated?: boolean;
  preventOverscroll?: boolean;
  footer?: ReactNode;
  hideCloseButton?: boolean;
  disableClose?: boolean;
  children: ReactNode;
}) {
  // Freeze body scroll while open (shared counter — only restores when all overlays close).
  useScrollLock();

  // Later-opened dialogs get a higher slot so their backdrop sits above the panel
  // of every earlier dialog — otherwise a nested confirm's backdrop (z-50) would
  // hide under the opener's panel (z-60) and never dim/blur it.
  const depth = useOverlayDepth();
  const baseDepth = elevated ? 80 : 50;
  const backdropZ = baseDepth + Math.max(0, depth - 1) * 20;
  const panelZ = backdropZ + 10;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disableClose) return;
      // Escape closes only the top-most dialog, leaving the opener untouched.
      if (e.key === "Escape" && depth >= openOverlayCount) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, depth, disableClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm"
        style={{ zIndex: backdropZ }}
        aria-hidden="true"
      />

      {/* Full-viewport scroll container — the overlay scrolls as one, so the
          scrollbar shows at the viewport's right edge like the page's own. */}
      <div
        className={`fixed inset-0 overflow-y-auto ${preventOverscroll ? "overscroll-none" : ""}`}
        style={{ zIndex: panelZ }}
      >
        <div className="flex min-h-full items-center justify-center px-2 pb-6 pt-6 sm:px-4 sm:pb-4 sm:pt-4">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex w-full flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl dark:border-white/10 dark:bg-surface-raised ${
              full ? "max-w-[92rem]" : xl ? "max-w-5xl" : wide ? "max-w-3xl" : "max-w-md"
            }`}
          >
            {/* Header band */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 dark:border-white/10 dark:bg-white/5">
              <h2 className="min-w-0 font-display text-lg tracking-wide text-navy-700 sm:text-xl dark:text-mist-100">
                {title}
              </h2>
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={disableClose}
                  aria-label="Close dialog"
                  className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-mist-100"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
            {/* Body — scrolls with the whole overlay when tall. */}
            <div className="px-4 py-4 sm:px-5">{children}</div>
            {/* Footer band — follows the content; the overlay scroll handles overflow. */}
            {footer && (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 dark:border-white/10 dark:bg-white/5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
