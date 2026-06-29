import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Right-aligned slot for page-level actions (e.g. a "New" button). */
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-navy-700 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 font-sans text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
