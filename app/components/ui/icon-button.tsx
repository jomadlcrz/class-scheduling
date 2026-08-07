import type { ReactNode } from "react";

const baseClassName =
  "grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  neutral:
    "text-slate-400 hover:bg-slate-200/60 hover:text-navy-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white",
  danger:
    "text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400",
} as const;

type IconButtonProps = {
  /** Accessible name — icon-only buttons must always carry one. */
  label: string;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: keyof typeof variants;
  disabled?: boolean;
  /** Native tooltip; defaults to `label`. Pass "" to suppress. */
  title?: string;
  /** Extra classes appended to the base (e.g. a backdrop on floating cards). */
  className?: string;
};

/** Square, icon-only action button — the shared replacement for the per-file
 * `actionButtonClassName` constants. `label` becomes the `aria-label`. */
export function IconButton({
  label,
  children,
  onClick,
  type = "button",
  variant = "neutral",
  disabled = false,
  title,
  className,
}: IconButtonProps) {
  const classes = `${baseClassName} ${variants[variant]}${className ? ` ${className}` : ""}`;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title ?? label}
      className={classes}
    >
      {children}
    </button>
  );
}
