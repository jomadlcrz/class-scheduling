import { EditIcon, EyeIcon } from "~/components/ui/icons";

export type CurriculumBuilderMode = "edit" | "view";

type CurriculumBuilderModeToggleProps = {
  value: CurriculumBuilderMode;
  onChange: (mode: CurriculumBuilderMode) => void;
};

const options = [
  { mode: "edit", label: "Edit Mode", Icon: EditIcon },
  { mode: "view", label: "View Mode", Icon: EyeIcon },
] as const;

/** Switches the curriculum builder between inline editing and read-only preview. */
export function CurriculumBuilderModeToggle({
  value,
  onChange,
}: CurriculumBuilderModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Curriculum builder mode"
      className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-white/15 dark:bg-white/5"
    >
      {options.map(({ mode, label, Icon }) => {
        const isActive = value === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(mode)}
            className={`inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 px-3 font-body text-xs font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 [&+button]:border-l [&+button]:border-slate-300 dark:[&+button]:border-white/15 ${
              isActive
                ? "bg-navy-800 text-white dark:bg-white dark:text-navy-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-navy-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
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
