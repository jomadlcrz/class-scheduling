type RadioProps = {
  id: string;
  name: string;
  label?: string;
  value?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Non-interactive display mode — selection is driven by a wrapping element (e.g. a row button). */
  readOnly?: boolean;
  className?: string;
};

/** Custom-rendered radio dot (appearance-none + border trick) so it looks the same across browsers. */
export function Radio({ id, name, label, value, checked, onChange, readOnly, className }: RadioProps) {
  return (
    <div className={`flex w-fit items-center gap-2 ${className ?? ""}`.trim()}>
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-label={label}
        className={`size-4 shrink-0 appearance-none rounded-full border-2 border-slate-300 bg-transparent transition-all duration-150 checked:border-[5px] checked:border-navy-800 dark:border-white/25 dark:checked:border-gold-400 ${
          readOnly ? "pointer-events-none" : "cursor-pointer"
        }`}
      />
      {label && <span className="font-body text-sm text-slate-600 dark:text-slate-300">{label}</span>}
    </div>
  );
}
