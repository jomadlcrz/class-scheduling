import type { ReactNode, TextareaHTMLAttributes } from "react";
import { FieldChrome, inputClassName } from "~/components/ui/input";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> & {
  id: string;
  label: string;
  labelEnd?: ReactNode;
  hint?: string;
};

export function Textarea({ id, label, labelEnd, hint, required, ...textareaProps }: TextareaProps) {
  return (
    <FieldChrome id={id} label={label} labelEnd={labelEnd} hint={hint} required={required}>
      <textarea
        id={id}
        name={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`${inputClassName} min-h-32 resize-y`}
        {...textareaProps}
      />
    </FieldChrome>
  );
}
