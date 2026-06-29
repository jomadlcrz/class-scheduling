import type { ComponentPropsWithoutRef } from "react";

export function Label({ className = "", ...props }: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={`font-sans text-sm font-medium text-gray-700 dark:text-slate-300 ${className}`.trim()}
      {...props}
    />
  );
}
