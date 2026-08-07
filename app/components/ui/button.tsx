import type { ReactNode } from "react";
import { Spinner } from "~/components/ui/spinner";

const baseClassName =
  "flex cursor-pointer items-center justify-center gap-2 font-body font-medium transition-all duration-150 active:scale-[0.97] active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary:
    "bg-navy-800 text-white hover:bg-navy-700 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-200",
  danger:
    "bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400",
  outline:
    "border border-slate-300 text-navy-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10",
} as const;

/** Rounding lives in exactly one class so the two radii never collide. Pill CTAs
 * (hero/auth moments) also carry a soft elevation. */
function shapeClassName(pill: boolean) {
  return pill ? "rounded-full shadow-lg shadow-navy-800/20" : "rounded-lg";
}

type ButtonProps = {
  type?: "submit" | "button";
  variant?: keyof typeof variants;
  /** Full-width form button (default); false for inline/dialog buttons. */
  block?: boolean;
  /** Pill shape with soft elevation — for hero/auth CTAs. */
  pill?: boolean;
  isLoading?: boolean;
  /** Label shown next to the spinner while loading. */
  loadingLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

export function Button({
  type = "submit",
  variant = "primary",
  block = true,
  pill = false,
  isLoading = false,
  loadingLabel,
  disabled = false,
  onClick,
  children,
}: ButtonProps) {
  const size = block ? "mt-1 w-full py-2.5 text-sm" : "px-3 py-1.5 text-sm";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClassName} ${variants[variant]} ${shapeClassName(pill)} ${size}`}
    >
      {isLoading ? (
        <>
          <Spinner />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

/** Anchor styled like the primary block button (e.g. success-state CTAs). */
export function ButtonLink({ href, onClick, children, className }: ButtonLinkProps) {
  const classes = `${baseClassName} ${variants.primary} rounded-lg w-full py-2.5 text-sm`;
  return (
    <a href={href} onClick={onClick} className={className ? `${classes} ${className}` : classes}>
      {children}
    </a>
  );
}
