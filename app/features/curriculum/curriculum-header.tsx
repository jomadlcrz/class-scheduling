import { GraduationCapIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
import type { ProgramCurriculum } from "~/types/curriculum";
import type { Program } from "~/types/program";

type CurriculumHeaderProps = {
  programs: Program[];
  selected: string;
  onChange: (code: string) => void;
  curriculum: ProgramCurriculum | null | "loading";
};

export function CurriculumHeader({ programs, selected, onChange, curriculum }: CurriculumHeaderProps) {
  const selectedProgram = programs.find((p) => p.code === selected);
  const isLoaded = curriculum !== null && curriculum !== "loading";
  const departmentCode = isLoaded ? curriculum.departmentCode : selectedProgram?.departmentCode;
  const hasSubjects = isLoaded && curriculum.groups.length > 0;
  const totalUnits = hasSubjects ? curriculum.totalUnits : null;
  const termCount = hasSubjects ? curriculum.groups.length : null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/80">
      <div className="flex flex-col gap-5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {departmentCode ? (
            <img
              src={departmentLogoUrl(departmentCode)}
              alt={`${departmentCode} logo`}
              onError={onDepartmentLogoError}
              className="size-14 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <GraduationCapIcon />
            </span>
          )}
          <div className="min-w-0 max-w-xs">
            <FieldChrome id="curriculum-program" label="Program">
              <Select
                items={[
                  { value: "", label: "Select a program…" },
                  ...programs.map((p) => ({ value: p.code, label: `${p.code} — ${p.name}` })),
                ]}
                value={selected}
                onValueChange={(v) => onChange((v as string) ?? "")}
              >
                <SelectTrigger id="curriculum-program">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a program…</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.code}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </div>
        </div>

        <div className="relative min-h-16 shrink-0 self-stretch sm:self-auto sm:pl-6 sm:text-right">
          {hasSubjects && (
            <>
              <div
                aria-hidden="true"
                className="blueprint-grid pointer-events-none absolute inset-0 -z-10 text-navy-900/5 dark:text-white/8"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 right-0 -z-10 size-32 opacity-20 dark:opacity-[0.15]"
                style={{ background: "radial-gradient(circle, var(--color-gold-400) 0%, transparent 70%)" }}
              />
            </>
          )}
          <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Units
          </p>
          {totalUnits === null ? (
            <p className="mt-0.5 font-display text-2xl tracking-wide text-slate-300 dark:text-slate-600">—</p>
          ) : (
            <>
              <p className="mt-0.5 font-display text-4xl tabular-nums tracking-wide text-navy-700 dark:text-white">
                {totalUnits}
              </p>
              <p className="font-body text-xs text-slate-400 dark:text-slate-500">
                across {termCount} term{termCount !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
