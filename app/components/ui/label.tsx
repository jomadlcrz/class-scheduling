import type { ComponentPropsWithoutRef } from "react";

type LabelProps = ComponentPropsWithoutRef<"label"> & {
  required?: boolean;
};

export function Label({ className = "", required, ...props }: LabelProps) {
  return (
    <label
      className={`font-body text-sm font-semibold text-gray-600 dark:text-slate-400 ${className}`.trim()}
      {...props}
    >
      {props.children}
      {required && (
        <span className="ml-0.5 text-red-500 dark:text-red-400" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
