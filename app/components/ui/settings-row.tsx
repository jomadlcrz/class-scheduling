import type { ReactNode } from "react";

type SettingsRowProps = {
  label: string;
  /** Id of the control inside `children`, so the label is clickable/focusable for it. */
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
};

/**
 * Flat label:value row for account-settings pages — label sits to the left of
 * the value on desktop (right-aligned, fixed width) and stacks above it on
 * mobile. Rows are meant to be wrapped in a `divide-y` container, not boxed.
 */
export function SettingsRow({ label, htmlFor, hint, children }: SettingsRowProps) {
  return (
    <div className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0 sm:flex-row sm:gap-6">
      <label
        htmlFor={htmlFor}
        className="shrink-0 font-body text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-40 sm:pt-2 sm:text-right"
      >
        {label}
      </label>
      <div className="min-w-0 flex-1">
        {children}
        {hint && <p className="mt-1.5 font-body text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
