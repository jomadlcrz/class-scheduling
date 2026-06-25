import { GridIcon, ListIcon } from "../../components/ui/icons";

export type ScheduleViewMode = "grid" | "table";

const OPTIONS: { mode: ScheduleViewMode; label: string; Icon: typeof GridIcon }[] = [
  { mode: "grid", label: "Grid View", Icon: GridIcon },
  { mode: "table", label: "Table View", Icon: ListIcon },
];

type Props = {
  value: ScheduleViewMode;
  onChange: (mode: ScheduleViewMode) => void;
};

/** Segmented control to switch between the grid and list schedule views. */
export function ScheduleViewToggle({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Schedule view"
      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/60 p-1 dark:border-white/10 dark:bg-white/5"
    >
      {OPTIONS.map(({ mode, label, Icon }) => {
        const isActive = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-sans text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
              isActive
                ? "bg-navy-700 text-white shadow-sm dark:bg-white/10 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Icon />
            {label}
          </button>
        );
      })}
    </div>
  );
}
