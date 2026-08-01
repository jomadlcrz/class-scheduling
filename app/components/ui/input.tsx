import { useState, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";

export const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-gray-900 placeholder-slate-400 outline-none transition-colors duration-150 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 dark:disabled:bg-white/3 dark:disabled:text-slate-500";

type FieldChromeProps = {
  id: string;
  label: string;
  /** Rendered on the right side of the label row (e.g. a "Forgot password?" link). */
  labelEnd?: ReactNode;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

export function FieldChrome({ id, label, labelEnd, hint, required, children }: FieldChromeProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {labelEnd ? (
        <div className="flex items-center justify-between">
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
          {labelEnd}
        </div>
      ) : (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && (
        <p id={`${id}-hint`} className="font-body text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
  id: string;
  label: string;
  labelEnd?: ReactNode;
  hint?: string;
  icon?: ReactNode;
};

export function Input({ id, label, labelEnd, hint, required, icon, ...inputProps }: InputProps) {
  return (
    <FieldChrome id={id} label={label} labelEnd={labelEnd} hint={hint} required={required}>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          name={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${inputClassName} ${icon ? "pl-10" : ""}`}
          {...inputProps}
        />
      </div>
    </FieldChrome>
  );
}

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type"> & {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  labelEnd?: ReactNode;
  hint?: string;
  icon?: ReactNode;
};

/** Password field with a show/hide visibility toggle. */
export function PasswordInput({
  id,
  label,
  autoComplete,
  labelEnd,
  hint,
  required,
  icon,
  placeholder = "••••••••",
  ...inputProps
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <FieldChrome id={id} label={label} labelEnd={labelEnd} hint={hint} required={required}>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${inputClassName} ${icon ? "pl-10" : ""} pr-11`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors duration-150 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </FieldChrome>
  );
}
