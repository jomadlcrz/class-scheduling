import type { ReactNode } from "react";
import { ChevronDownIcon } from "./icons";
import { FieldChrome, inputClassName } from "./input";

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> & {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
};

export function Select({ id, label, hint, children, ...selectProps }: SelectProps) {
  return (
    <FieldChrome id={id} label={label} hint={hint}>
      <div className="relative">
        <select
          id={id}
          name={id}
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
    </FieldChrome>
  );
}
