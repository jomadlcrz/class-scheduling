import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "../../components/ui/icons";
import type { CurriculumGroup, ProgramCurriculum } from "../../types/curriculum";
import { SEMESTER_LABELS, YEAR_LEVEL_LABELS } from "../../types/subject";
import type { YearLevel } from "../../types/subject";
import { CurriculumSubjects } from "./curriculum-subjects";

type CurriculumTableProps = {
  curriculum: ProgramCurriculum;
};

export function CurriculumTable({ curriculum }: CurriculumTableProps) {
  const yearLevels = [...new Set(curriculum.groups.map((g) => g.yearLevel))].sort() as YearLevel[];

  return (
    <div className="flex flex-col gap-4">
      {yearLevels.map((year) => {
        const yearGroups = curriculum.groups.filter((g) => g.yearLevel === year);
        const yearUnits = yearGroups.reduce((sum, g) => sum + g.totalUnits, 0);
        return (
          <YearBlock
            key={year}
            yearLevel={year}
            yearUnits={yearUnits}
            groups={yearGroups}
          />
        );
      })}
    </div>
  );
}

function YearBlock({
  yearLevel,
  yearUnits,
  groups,
}: {
  yearLevel: YearLevel;
  yearUnits: number;
  groups: CurriculumGroup[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400"
      >
        <span className="font-sans font-semibold text-navy-700 dark:text-white">
          {YEAR_LEVEL_LABELS[yearLevel]}
        </span>
        <span className="flex items-center gap-2">
          <span className="font-sans text-sm text-slate-400 dark:text-slate-500">
            {yearUnits} units
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-white/8">
          {groups.map((group) => (
            <div
              key={`${group.yearLevel}-${group.semester}`}
              className="border-b border-slate-100 last:border-0 dark:border-white/8"
            >
              <div className="flex items-center justify-between px-5 py-3">
                <span className="font-sans text-sm font-medium text-slate-600 dark:text-slate-300">
                  {SEMESTER_LABELS[group.semester]}
                </span>
                <span className="font-sans text-xs text-slate-400 dark:text-slate-500">
                  {group.subjects.length} subject{group.subjects.length !== 1 ? "s" : ""} · {group.totalUnits} units
                </span>
              </div>
              <div className="px-5 pb-4">
                <CurriculumSubjects group={group} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
