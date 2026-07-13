import type { ReactNode } from "react";

const variants = {
  default:
    "border-slate-300 bg-white text-navy-700 [&>svg]:text-navy-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:[&>svg]:text-slate-300",
  destructive:
    "border-red-200 bg-red-50 text-red-700 [&>svg]:text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300 dark:[&>svg]:text-red-400",
  success:
    "border-green-200 bg-green-50 text-green-800 [&>svg]:text-green-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:[&>svg]:text-emerald-400",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600 dark:border-gold-400/25 dark:bg-gold-400/10 dark:text-gold-300 dark:[&>svg]:text-gold-400",
} as const;

export type AlertVariant = keyof typeof variants;

type AlertProps = {
  variant?: AlertVariant;
  className?: string;
  children: ReactNode;
};

/** Callout for user attention: icon, title, description, optional action. */
export function Alert({ variant = "default", className, children }: AlertProps) {
  return (
    <div
      role="alert"
      className={`relative grid w-full grid-cols-[0_1fr] has-[>svg]:grid-cols-[20px_1fr] items-start gap-x-3 gap-y-1 rounded-lg border px-4 py-3 font-body [&>svg]:size-5 [&>svg]:translate-y-0.5 ${variants[variant]} ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}

type AlertPartProps = {
  className?: string;
  children: ReactNode;
};

export function AlertTitle({ className, children }: AlertPartProps) {
  return (
    <h5
      className={`col-start-2 text-sm font-semibold leading-none tracking-wide ${className ?? ""}`.trim()}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({ className, children }: AlertPartProps) {
  return (
    <div className={`col-start-2 text-sm leading-relaxed opacity-90 ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}

/** Action element (e.g. a button) pinned to the alert's top-right corner. */
export function AlertAction({ className, children }: AlertPartProps) {
  return (
    <div className={`absolute right-3 top-3 ${className ?? ""}`.trim()}>{children}</div>
  );
}
