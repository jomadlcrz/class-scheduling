import type { ReactNode } from "react";
import { ChevronDownIcon } from "./icons";
import { FieldChrome, inputClassName } from "./input";

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> & {
  id: string;
  label: string;
  hint?: string;
  /** Toolbar mode: no visible label; `label` becomes the aria-label. */
  hideLabel?: boolean;
  children: ReactNode;
};

export function Select({ id, label, hint, hideLabel = false, children, ...selectProps }: SelectProps) {
  const control = (
    <div className="relative">
      <select
        id={id}
        name={id}
        aria-label={hideLabel ? label : undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        // Native dropdown popups ignore the field styling, so the options
        // need explicit colors or they're unreadable in dark mode.
        className={`${inputClassName} cursor-pointer appearance-none pr-10 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-navy-900 dark:[&>option]:text-white`}
        {...selectProps}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
      >
        <ChevronDownIcon />
      </span>
    </div>
  );

  if (hideLabel) return control;

  return (
    <FieldChrome id={id} label={label} hint={hint}>
      {control}
    </FieldChrome>
  );
}
