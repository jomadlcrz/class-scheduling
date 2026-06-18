import type { ReactNode } from "react";

/** Composable table primitives sharing the card-style chrome of the app. */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5">
      <table className="w-full text-left font-sans text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-200 dark:border-white/10">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeader({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 ${className ?? ""}`}
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
      className={`transition-colors duration-150 hover:bg-slate-100/60 dark:hover:bg-white/5 ${className ?? ""}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-slate-700 dark:text-slate-300 ${className ?? ""}`}>
      {children}
    </td>
  );
}
