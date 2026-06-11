import type { ReactNode } from "react";
import { Spinner } from "./spinner";

const buttonClassName =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-navy-800 py-3 font-sans text-base font-medium text-white transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100";

type ButtonProps = {
  isLoading?: boolean;
  /** Label shown next to the spinner while loading. */
  loadingLabel?: string;
  children: ReactNode;
};

/** Primary full-width submit button with a built-in loading state. */
export function Button({ isLoading = false, loadingLabel, children }: ButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`mt-1 ${buttonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
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

/** Anchor styled like the primary button (e.g. success-state CTAs). */
export function ButtonLink({ href, children, className }: ButtonLinkProps) {
  return (
    <a href={href} className={className ? `${buttonClassName} ${className}` : buttonClassName}>
      {children}
    </a>
  );
}
