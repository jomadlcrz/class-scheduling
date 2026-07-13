import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  children?: ReactNode;
  /** Optional CTA rendered below the description (e.g. a Button). */
  action?: ReactNode;
};

/** Centered placeholder for empty lists / no search results. */
export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <p className="font-display text-2xl tracking-wide text-gray-900 dark:text-white">{title}</p>
      {children && (
        <p className="mt-1.5 max-w-sm font-body text-sm text-slate-500 dark:text-slate-400">
          {children}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
