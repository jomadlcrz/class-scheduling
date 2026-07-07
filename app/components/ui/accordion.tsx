import { type ReactNode } from "react";

type AccordionItemProps = {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  adornment?: ReactNode;
};

export function AccordionItem({ title, children, defaultOpen, adornment }: AccordionItemProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/60"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm text-navy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 dark:text-white [&::-webkit-details-marker]:hidden">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className="flex-1">{title}</span>
        {adornment && <span className="shrink-0">{adornment}</span>}
      </summary>
      <div className="border-t border-slate-200 dark:border-white/10">{children}</div>
    </details>
  );
}

type AccordionProps = {
  children: ReactNode;
};

export function Accordion({ children }: AccordionProps) {
  return <div className="flex flex-col gap-3">{children}</div>;
}
