import type { ReactNode } from "react";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";

type EmptyStateProps = {
  title: string;
  children?: ReactNode;
  /** Optional CTA rendered below the description (e.g. a Button). */
  action?: ReactNode;
};

/** Centered placeholder for empty lists / no search results. */
export function EmptyState({ title, children, action }: EmptyStateProps) {
  if (/^(couldn.t|unable to) load/i.test(title)) {
    return <DataLoadAlert title={title} message={children ?? "Something went wrong while loading this data."} action={action} />;
  }

  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <p className="font-display text-2xl tracking-wide text-navy-800 dark:text-mist-100">{title}</p>
      {children && (
        <p className="mt-1.5 max-w-sm font-body text-sm text-slate-500 dark:text-slate-400">
          {children}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
