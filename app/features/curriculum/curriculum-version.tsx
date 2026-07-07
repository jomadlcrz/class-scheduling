import { Badge } from "~/components/ui/badge";
import type { ProgramCurriculum } from "~/types/curriculum";

type CurriculumVersionProps = {
  curriculum: ProgramCurriculum;
};

function departmentLogo(code: string): string {
  return `/images/departments/${code.toLowerCase()}.avif`;
}

export function CurriculumVersion({ curriculum }: CurriculumVersionProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/80">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4">
          <img
            src={departmentLogo(curriculum.departmentCode)}
            alt={`${curriculum.departmentCode} logo`}
            className="size-14 rounded-lg object-contain"
          />
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Program
            </p>
            <p className="mt-0.5 font-body text-base font-semibold text-navy-700 dark:text-white">
              {curriculum.programName}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge tone="navy">{curriculum.programCode}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
      </div>
    </div>
  );
}
