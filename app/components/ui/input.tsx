import { useState, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";
import { Label } from "./label";

export const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-sans text-sm text-gray-900 placeholder-slate-400 outline-none transition-colors duration-150 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20";

type FieldChromeProps = {
  id: string;
  label: string;
  /** Rendered on the right side of the label row (e.g. a "Forgot password?" link). */
  labelEnd?: ReactNode;
  hint?: string;
  children: ReactNode;
};

export function FieldChrome({ id, label, labelEnd, hint, children }: FieldChromeProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {labelEnd ? (
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>
            {label}
          </Label>
          {labelEnd}
        </div>
      ) : (
        <Label htmlFor={id}>
          {label}
        </Label>
      )}
      {children}
      {hint && (
        <p id={`${id}-hint`} className="font-sans text-xs text-slate-400 dark:text-slate-500">
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
};

export function Input({ id, label, labelEnd, hint, ...inputProps }: InputProps) {
  return (
    <FieldChrome id={id} label={label} labelEnd={labelEnd} hint={hint}>
      <input
        id={id}
        name={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputClassName}
        {...inputProps}
      />
    </FieldChrome>
  );
}

type PasswordInputProps = {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  labelEnd?: ReactNode;
  hint?: string;
};

/** Password field with a show/hide visibility toggle. */
export function PasswordInput({ id, label, autoComplete, labelEnd, hint }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <FieldChrome id={id} label={label} labelEnd={labelEnd} hint={hint}>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          placeholder="••••••••"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${inputClassName} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors duration-150 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:text-slate-300"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </FieldChrome>
  );
}
