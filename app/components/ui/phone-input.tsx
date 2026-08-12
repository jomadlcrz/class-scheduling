import type { ChangeEventHandler, InputHTMLAttributes, ReactNode } from "react";
import { FieldChrome, inputClassName } from "~/components/ui/input";
import { formatPhoneNumberInput, MAX_FORMATTED_PHONE_LENGTH } from "~/lib/phone-number";

type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className" | "type" | "inputMode" | "pattern" | "onChange" | "placeholder" | "maxLength"
> & {
  id: string;
  label: string;
  labelEnd?: ReactNode;
  hint?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

/** Phone-aware input with as-you-type formatting. Submit handlers normalize to E.164. */
export function PhoneInput({
  id,
  label,
  labelEnd,
  hint,
  required,
  disabled,
  onChange,
  value,
  defaultValue,
  ...inputProps
}: PhoneInputProps) {
  return (
    <FieldChrome id={id} label={label} labelEnd={labelEnd} hint={hint} required={required}>
      <div className="flex w-full">
        <span
          aria-label="Philippines country code"
          className={`inline-flex shrink-0 select-none items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-3 font-body text-sm font-medium text-slate-600 dark:border-white/15 dark:bg-white/8 dark:text-slate-300 ${
            disabled ? "opacity-60" : ""
          }`}
        >
          +63
        </span>
        <input
          {...inputProps}
          id={id}
          name={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          maxLength={MAX_FORMATTED_PHONE_LENGTH}
          required={required}
          disabled={disabled}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${inputClassName} min-w-0 rounded-l-none`}
          value={value == null ? undefined : formatPhoneNumberInput(String(value))}
          defaultValue={defaultValue == null ? undefined : formatPhoneNumberInput(String(defaultValue))}
          onChange={(event) => {
            event.currentTarget.value = formatPhoneNumberInput(event.currentTarget.value);
            onChange?.(event);
          }}
        />
      </div>
    </FieldChrome>
  );
}
