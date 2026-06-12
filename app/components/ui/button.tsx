import type { ReactNode } from "react";
import { Spinner } from "./spinner";

const baseClassName =
  "flex cursor-pointer items-center justify-center gap-2 rounded-lg font-sans font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary:
    "bg-navy-800 text-white hover:bg-navy-700 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400",
  outline:
    "border border-slate-300 text-navy-700 hover:bg-slate-200/60 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10",
} as const;

type ButtonProps = {
  type?: "submit" | "button";
  variant?: keyof typeof variants;
  /** Full-width form button (default); false for inline/dialog buttons. */
  block?: boolean;
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
  isLoading = false,
  loadingLabel,
  disabled = false,
  onClick,
  children,
}: ButtonProps) {
  const size = block ? "mt-1 w-full py-3 text-base" : "px-4 py-2 text-sm";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClassName} ${variants[variant]} ${size}`}
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
  children: ReactNode;
  className?: string;
};

/** Anchor styled like the primary block button (e.g. success-state CTAs). */
export function ButtonLink({ href, children, className }: ButtonLinkProps) {
  const classes = `${baseClassName} ${variants.primary} w-full py-3 text-base`;
  return (
    <a href={href} className={className ? `${classes} ${className}` : classes}>
      {children}
    </a>
  );
}
