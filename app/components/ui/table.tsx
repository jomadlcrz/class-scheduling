import type { ReactNode } from "react";

/** Composable table primitives sharing the card-style chrome of the app. */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5">
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

export function TableHeader({ children }: { children?: ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-200 dark:divide-white/10">{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="transition-colors duration-150 hover:bg-slate-100/60 dark:hover:bg-white/5">
      {children}
    </tr>
  );
}

export function TableCell({ children }: { children?: ReactNode }) {
  return <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{children}</td>;
}
