type CheckboxProps = {
  id: string;
  label: React.ReactNode;
  /** Accessible name for the checkbox. Falls back to label text when label is a string. */
  ariaLabel?: string;
  name?: string;
  /** Submitted as this value when checked (for FormData.getAll on shared names). */
  value?: string;
  defaultChecked?: boolean;
  /** Controlled checked state; pairs with onChange. Omit for uncontrolled (defaultChecked) usage. */
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

/** Only the box itself is clickable — the label text is plain, non-interactive. */
export function Checkbox({ id, label, ariaLabel, name, value, defaultChecked, checked, onChange }: CheckboxProps) {
  const isControlled = checked !== undefined;

  return (
    <div className="flex w-fit items-center gap-2">
      <input
        id={id}
        name={name ?? id}
        type="checkbox"
        value={value}
        {...(isControlled
          ? { checked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked) }
          : { defaultChecked })}
        aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
        className="size-4 cursor-pointer accent-navy-800 dark:accent-gold-400"
      />
      <span className="font-body text-sm text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
}
