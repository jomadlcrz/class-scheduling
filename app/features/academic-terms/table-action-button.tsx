import type { ButtonHTMLAttributes, ReactNode } from "react";

const tones = {
  blue: "border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-400/30 dark:text-blue-300 dark:hover:bg-blue-400/10",
  amber: "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-gold-400/30 dark:text-gold-300 dark:hover:bg-gold-400/10",
  slate: "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10",
} as const;

type TableActionButtonProps = {
  children: ReactNode;
  tone?: keyof typeof tones;
} & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "disabled" | "onClick" | "title"
>;

/** Consistent row action for Academic Terms tables. */
export function TableActionButton({
  children,
  tone = "blue",
  ...buttonProps
}: TableActionButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
