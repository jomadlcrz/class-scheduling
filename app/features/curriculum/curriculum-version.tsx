import type { ProgramCurriculum } from "~/types/curriculum";

type CurriculumVersionProps = {
  curriculum: ProgramCurriculum;
};

export function CurriculumVersion({ curriculum }: CurriculumVersionProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-white/3">
      <div>
        <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Program
        </p>
        <p className="mt-0.5 font-body text-base font-semibold text-navy-700 dark:text-white">
          {curriculum.programName}
        </p>
        <p className="font-body text-sm text-slate-500 dark:text-slate-400">
          {curriculum.programCode}
        </p>
      </div>
      <div className="text-right">
        <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Total Units
        </p>
        <p className="mt-0.5 font-display text-2xl tracking-wide text-navy-700 dark:text-white">
          {curriculum.totalUnits}
        </p>
        <p className="font-body text-xs text-slate-400 dark:text-slate-500">
          across {curriculum.groups.length} term{curriculum.groups.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
