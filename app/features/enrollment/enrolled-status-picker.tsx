import { GraduationCapIcon, UsersIcon } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";

/** Presentational copy only — "Regular"/"Irregular" themselves are backend enum values (enumService.academicStatus). */
const DESCRIPTIONS: Record<string, { icon: React.ReactNode; description: string }> = {
  Regular: { icon: <GraduationCapIcon />, description: "Enroll student based on the program curriculum for the selected term." },
  Irregular: { icon: <UsersIcon />, description: "Manually select subjects for the student." },
};

type EnrolledStatusPickerProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

/** Regular/Irregular selector cards — shared between the Add Student and Re-enroll wizards. */
export function EnrolledStatusPicker({ value, options, onChange }: EnrolledStatusPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label required>Enrolled Status</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const meta = DESCRIPTIONS[option];
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                isSelected
                  ? "border-navy-700 bg-navy-700/5 dark:border-gold-400 dark:bg-gold-400/10"
                  : "border-slate-300 bg-white hover:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
              }`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                  isSelected
                    ? "bg-navy-700 text-white dark:bg-gold-400 dark:text-navy-900"
                    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                }`}
              >
                {meta?.icon ?? <UsersIcon />}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">{option}</span>
                <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                  {meta?.description ?? ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
