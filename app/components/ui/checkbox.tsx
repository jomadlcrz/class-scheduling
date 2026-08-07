type CheckboxProps = {
  id: string;
  label?: React.ReactNode;
  /** Accessible name for the checkbox. Falls back to label text when label is a string. */
  ariaLabel?: string;
  /** Hide the label text — use in tables/toolbars with ariaLabel instead. */
  hideLabel?: boolean;
  /** Table cell variant — centered with a larger, easy-to-click target. */
  inset?: boolean;
  name?: string;
  /** Submitted as this value when checked (for FormData.getAll on shared names). */
  value?: string;
  defaultChecked?: boolean;
  /** Controlled checked state; pairs with onChange. Omit for uncontrolled (defaultChecked) usage. */
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

const inputClassName =
  "size-4 cursor-pointer accent-navy-800 dark:accent-gold-400";

/** Gold focus ring for the standalone checkbox; the inset variant rings via its wrapper instead. */
const focusRingClassName =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400";

/** Only the box itself is clickable — the label text is plain, non-interactive. */
export function Checkbox({
  id,
  label,
  ariaLabel,
  hideLabel = false,
  inset = false,
  name,
  value,
  defaultChecked,
  checked,
  onChange,
}: CheckboxProps) {
  const isControlled = checked !== undefined;
  const inputProps = {
    id,
    name: name ?? id,
    type: "checkbox" as const,
    value,
    "aria-label": ariaLabel ?? (typeof label === "string" ? label : undefined),
    className: inset ? inputClassName : `${inputClassName} ${focusRingClassName}`,
    ...(isControlled
      ? { checked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked) }
      : { defaultChecked }),
  };

  if (inset) {
    return (
      <label
        htmlFor={id}
        className="mx-auto grid size-8 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-slate-100 focus-within:ring-2 focus-within:ring-gold-400/60 dark:hover:bg-white/10"
      >
        <input {...inputProps} />
      </label>
    );
  }

  return (
    <div className="flex w-fit items-center gap-2">
      <input {...inputProps} />
      {!hideLabel && label != null && (
        <span className="font-body text-sm text-slate-600 dark:text-slate-300">{label}</span>
      )}
    </div>
  );
}
