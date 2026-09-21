import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

/** Composable table primitives sharing the card-style chrome of the app. */

const TableContext = createContext<{
  verticalBorders?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}>({
  verticalBorders: false,
  striped: false,
  hoverable: true,
});

export function Table({
  children,
  className,
  tableClassName,
  verticalBorders = false,
  striped = false,
  hoverable = true,
}: {
  children: ReactNode;
  className?: string;
  tableClassName?: string;
  verticalBorders?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}) {
  return (
    <TableContext.Provider value={{ verticalBorders, striped, hoverable }}>
      <div
        className={`relative scrollbar-thin overflow-x-auto rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5 ${className ?? ""}`.trim()}
      >
        <table className={`w-full text-left font-body text-sm ${tableClassName ?? ""}`.trim()}>
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export function TableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={`border-b-2 border-slate-300 bg-slate-50 dark:border-white/10 dark:bg-surface-raised [&_th]:border-b-2 [&_th]:border-slate-300 dark:[&_th]:border-white/10 [&_th]:bg-slate-50 dark:[&_th]:bg-surface-raised ${className ?? ""}`.trim()}
    >
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeader({
  children,
  className,
  dense,
  colSpan,
  rowSpan,
  scope,
  verticalBorder,
}: {
  children?: ReactNode;
  className?: string;
  /** Tighter padding for data-dense tables (many columns, long lists). */
  dense?: boolean;
  colSpan?: number;
  rowSpan?: number;
  scope?: "col" | "row" | "colgroup" | "rowgroup";
  verticalBorder?: boolean;
}) {
  const { verticalBorders: tableVertical } = useContext(TableContext);
  const showVertical = verticalBorder ?? tableVertical;
  return (
    <th
      scope={scope}
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`${dense ? "px-3 py-1.5" : "px-4 py-2.5"} border-b-2 border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-surface-raised ${showVertical ? "border-r border-slate-300 dark:border-white/10 last:border-r-0" : ""} text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className ?? ""}`.trim()}
    >
      {children}
    </th>
  );
}

export function TableBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tbody
      className={`divide-y divide-slate-200 dark:divide-white/10 ${className ?? ""}`.trim()}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className,
  onClick,
  hoverable,
  striped,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  striped?: boolean;
}) {
  const context = useContext(TableContext);
  const isHoverable = hoverable ?? context.hoverable ?? true;
  const isStriped = striped ?? context.striped ?? false;

  const hoverClass = isHoverable
    ? "transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/5"
    : "";
  const stripeClass = isStriped
    ? "odd:bg-white even:bg-slate-50/70 dark:odd:bg-transparent dark:even:bg-white/[0.025]"
    : "";

  return (
    <tr
      className={`group ${hoverClass} ${stripeClass} ${className ?? ""}`.trim()}
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
  rowSpan,
  style,
  dense,
  verticalBorder,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  style?: CSSProperties;
  /** Tighter padding for data-dense tables (many columns, long lists). */
  dense?: boolean;
  verticalBorder?: boolean;
}) {
  const { verticalBorders: tableVertical } = useContext(TableContext);
  const showVertical = verticalBorder ?? tableVertical;
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={style}
      className={`${dense ? "px-3 py-1.5" : "px-4 py-2.5"} border-b border-slate-200 dark:border-white/10 group-last:border-b-0 ${showVertical ? "border-r border-slate-200 dark:border-white/10" : ""} text-slate-700 dark:text-slate-300 ${className ?? ""}`.trim()}
    >
      {children}
    </td>
  );
}
