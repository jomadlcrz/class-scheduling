type TabOption<T extends string | number> = {
  value: T;
  label: string;
};

type TabListProps<T extends string | number> = {
  ariaLabel: string;
  tabs: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  fullWidth?: boolean;
};

/** Horizontal tab strip used for year levels, resource filters, etc. */
export function TabList<T extends string | number>({
  ariaLabel,
  tabs,
  value,
  onChange,
  className,
  fullWidth = false,
}: TabListProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex ${fullWidth ? "w-full" : "flex-wrap"} gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-surface-overlay dark:bg-surface-raised/80 ${className ?? ""}`.trim()}
    >
      {tabs.map((tab) => (
        <button
          key={String(tab.value)}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`cursor-pointer rounded-lg px-4 py-2 font-body text-sm font-semibold transition-colors duration-150 ${
            fullWidth ? "flex-1 text-center justify-center flex items-center" : ""
          } ${
            value === tab.value
              ? "bg-navy-700 text-mist-100 dark:bg-white/15 dark:text-mist-100 shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
