type CheckboxProps = {
  id: string;
  label: string;
  name?: string;
};

/** Only the box itself is clickable — the label text is plain, non-interactive. */
export function Checkbox({ id, label, name }: CheckboxProps) {
  return (
    <div className="flex w-fit items-center gap-2">
      <input
        id={id}
        name={name ?? id}
        type="checkbox"
        aria-label={label}
        className="size-4 cursor-pointer accent-navy-800 dark:accent-gold-400"
      />
      <span className="font-sans text-sm text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
}
