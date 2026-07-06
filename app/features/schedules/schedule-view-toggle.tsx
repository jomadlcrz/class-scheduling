import { GridIcon, ListIcon } from "../../components/ui/icons";

export type ScheduleViewMode = "grid" | "table";

type ScheduleViewToggleOption<T extends string = ScheduleViewMode> = {
  mode: T;
  title: string;
  Icon: typeof GridIcon;
};

const DEFAULT_OPTIONS = [
  { mode: "grid", title: "Grid view", Icon: GridIcon },
  { mode: "table", title: "List view", Icon: ListIcon },
  ] as const satisfies readonly ScheduleViewToggleOption[];

type Props<T extends string = ScheduleViewMode> = {
  value: T;
  onChange: (mode: T) => void;
  options?: readonly ScheduleViewToggleOption<T>[];
  ariaLabel?: string;
};

/** Segmented control to switch between the grid and list schedule views. */
export function ScheduleViewToggle<T extends string = ScheduleViewMode>({
  value,
  onChange,
  options,
  ariaLabel = "Schedule view",
}: Props<T>) {
  const resolvedOptions = (options ?? DEFAULT_OPTIONS) as readonly ScheduleViewToggleOption<T>[];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5"
    >
      {resolvedOptions.map(({ mode, title, Icon }) => {
        const isActive = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={isActive}
            title={title}
            aria-label={title}
            className={`inline-flex h-8 w-9 cursor-pointer items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 [&+button]:border-l [&+button]:border-slate-300 dark:[&+button]:border-white/10 ${
              isActive
                ? "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-white"
                : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-500 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-slate-300"
            }`}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}
