import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState, type ReactNode } from "react";

type AccordionItemProps = {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  adornment?: ReactNode;
  /** "flat" drops the bordered/rounded card chrome — for nesting inside another AccordionItem without stacking boxes. */
  variant?: "boxed" | "flat";
};

export function AccordionItem({
  title,
  children,
  defaultOpen,
  open,
  onOpenChange,
  adornment,
  variant = "boxed",
}: AccordionItemProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const reduceMotion = useReducedMotion();
  const id = useId();
  const triggerId = `accordion-trigger-${id}`;
  const panelId = `accordion-panel-${id}`;
  const isFlat = variant === "flat";

  function toggle() {
    const next = !isOpen;
    if (isControlled) onOpenChange?.(next);
    else setInternalOpen(next);
  }

  return (
    <div
      className={
        isFlat ? "" : "rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5"
      }
    >
      <div className="flex min-h-13 items-stretch">
        <button
          id={triggerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={toggle}
          className={
            isFlat
              ? "flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-1 py-2 text-left text-sm text-navy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-mist-100"
              : "flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-5 py-3 text-left text-sm text-navy-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 dark:text-mist-100 dark:hover:bg-white/5"
          }
        >
          <span className="min-w-0 flex-1">{title}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500"
            style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            aria-hidden="true"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
        {adornment && <div className="flex shrink-0 items-center py-2 pr-3">{adornment}</div>}
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={isFlat ? "" : "border-t border-slate-200 dark:border-white/10"}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type AccordionProps = {
  children: ReactNode;
};

export function Accordion({ children }: AccordionProps) {
  return <div className="flex flex-col gap-3">{children}</div>;
}
