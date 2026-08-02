import { motion } from "motion/react";
import type { ReactNode } from "react";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

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
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className={`relative grid w-full grid-cols-[0_1fr] has-[>svg]:grid-cols-[20px_1fr] has-[>[data-alert-action]]:grid-cols-[0_1fr_auto] has-[>svg]:has-[>[data-alert-action]]:grid-cols-[20px_1fr_auto] items-start gap-x-3 gap-y-2 rounded-lg border px-4 py-3 font-body [&>svg]:size-5 [&>svg]:translate-y-0.5 ${variants[variant]} ${className ?? ""}`.trim()}
    >
      {children}
    </motion.div>
  );
}

type AlertPartProps = {
  className?: string;
  children: ReactNode;
};

export function AlertTitle({ className, children }: AlertPartProps) {
  return (
    <h5
      className={`col-start-2 min-w-0 text-sm font-semibold leading-none tracking-wide ${className ?? ""}`.trim()}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({ className, children }: AlertPartProps) {
  return (
    <div className={`col-start-2 min-w-0 text-sm leading-relaxed opacity-90 ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}

/** Action aligned to the alert's trailing edge; stacks below copy on narrow screens. */
export function AlertAction({ className, children }: AlertPartProps) {
  return (
    <div
      data-alert-action
      className={`col-start-2 flex shrink-0 justify-start sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:self-center sm:justify-end ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
