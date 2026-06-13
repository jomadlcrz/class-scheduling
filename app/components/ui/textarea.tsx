import type { ReactNode } from "react";
import { FieldChrome, inputClassName } from "./input";

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> & {
  id: string;
  label: string;
  hint?: string;
  labelEnd?: ReactNode;
};

export function Textarea({ id, label, hint, labelEnd, ...rest }: TextareaProps) {
  return (
    <FieldChrome id={id} label={label} hint={hint} labelEnd={labelEnd}>
      <textarea
        id={id}
        name={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`${inputClassName} resize-none`}
        {...rest}
      />
    </FieldChrome>
  );
}
