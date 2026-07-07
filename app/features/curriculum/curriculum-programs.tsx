import { Select } from "~/components/ui/select";
import type { Program } from "~/types/program";

type CurriculumProgramsProps = {
  programs: Program[];
  selected: string;
  onChange: (code: string) => void;
};

export function CurriculumPrograms({ programs, selected, onChange }: CurriculumProgramsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900/80">
      <div className="max-w-xs">
        <Select
          id="curriculum-program"
          label="Program"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select a program…</option>
          {programs.map((p) => (
            <option key={p.id} value={p.code}>
              {p.code} — {p.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
