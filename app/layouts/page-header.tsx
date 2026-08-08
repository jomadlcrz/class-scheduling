import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  /** Right-aligned slot for page-level actions (e.g. a "New" button). */
  actions?: ReactNode;
};

/** Card-boxed page title, matching the settings layout page headers. */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white px-5 py-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
          {title}
        </h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
