import { inputClassName } from "~/components/ui/input";

type TableInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  className?: string;
};

/** Compact input styled for table cells and inline editing. */
export function TableInput({ className, ...props }: TableInputProps) {
  return (
    <input
      className={`${inputClassName} py-1.5 ${className ?? ""}`.trim()}
      {...props}
    />
  );
}
