import { Label } from "~/components/ui/label";

type SwitchProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Switch({ id, label, description, checked, onChange, disabled = false }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label
          htmlFor={id}
          className="cursor-pointer"
        >
          {label}
        </Label>
        {description && (
          <p className="font-body text-xs text-slate-400 dark:text-slate-500">{description}</p>
        )}
      </div>
      <button
        role="switch"
        id={id}
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked
            ? "bg-navy-700 dark:bg-gold-400"
            : "bg-slate-300 dark:bg-white/20"
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
