import type { ReactNode } from "react";

/** Composable table primitives sharing the card-style chrome of the app. */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5">
      <table className="w-full text-left font-body text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b-2 border-slate-300 bg-slate-50 dark:border-white/10 dark:bg-surface-raised">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeader({
  children,
  className,
  dense,
}: {
  children?: ReactNode;
  className?: string;
  /** Tighter padding for data-dense tables (many columns, long lists). */
  dense?: boolean;
}) {
  return (
    <th
      className={`${dense ? "px-3 py-1.5" : "px-4 py-2.5"} text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-200 dark:divide-white/10">{children}</tbody>;
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={`transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/5 ${className ?? ""}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
  colSpan,
  dense,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
  /** Tighter padding for data-dense tables (many columns, long lists). */
  dense?: boolean;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`${dense ? "px-3 py-1.5" : "px-4 py-2.5"} text-gray-700 dark:text-slate-300 ${className ?? ""}`}
    >
      {children}
    </td>
  );
}
