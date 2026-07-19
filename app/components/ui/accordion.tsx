import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type AccordionItemProps = {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  adornment?: ReactNode;
};

export function AccordionItem({ title, children, defaultOpen, open, adornment }: AccordionItemProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const reduceMotion = useReducedMotion();

  function toggle() {
    if (!isControlled) setInternalOpen((v) => !v);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-raised/60">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm text-navy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 dark:text-mist-100"
      >
        <span className="flex-1">{title}</span>
        {adornment && <span className="shrink-0">{adornment}</span>}
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
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-200 dark:border-white/10">{children}</div>
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
