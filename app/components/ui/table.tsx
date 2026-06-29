import type { ReactNode } from "react";

/** Composable table primitives sharing the card-style chrome of the app. */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-[#d9e3ef] bg-white dark:border-white/10 dark:bg-white/5">
      <table className="w-full text-left font-sans text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b-2 border-[#d9e3ef] bg-[#f8fafc] dark:border-white/10 dark:bg-white/5">
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
      className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#52637a] dark:text-slate-400 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[#e8edf5] dark:divide-white/10">{children}</tbody>;
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
      className={`transition-colors duration-150 hover:bg-[#f8fafc] dark:hover:bg-white/5 ${className ?? ""}`}
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
    <td className={`px-4 py-3 text-[#374151] dark:text-slate-300 ${className ?? ""}`}>
      {children}
    </td>
  );
}
