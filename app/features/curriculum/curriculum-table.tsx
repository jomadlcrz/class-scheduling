import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { ChevronDownIcon, ChevronRightIcon } from "~/components/ui/icons";
import type { CurriculumGroup, ProgramCurriculum } from "~/types/curriculum";
import { SEMESTER_LABELS, YEAR_LEVEL_LABELS } from "~/types/subject";
import type { YearLevel } from "~/types/subject";
import { CurriculumSubjects } from "~/features/curriculum/curriculum-subjects";

type CurriculumTableProps = {
  curriculum: ProgramCurriculum;
};

export function CurriculumTable({ curriculum }: CurriculumTableProps) {
  const yearLevels = [...new Set(curriculum.groups.map((g) => g.yearLevel))].sort() as YearLevel[];

  const codeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of curriculum.groups) {
      for (const subject of group.subjects) {
        map.set(subject.id, subject.code);
      }
    }
    return map;
  }, [curriculum]);

  return (
    <div className="flex flex-col gap-5">
      {yearLevels.map((year) => {
        const yearGroups = curriculum.groups.filter((g) => g.yearLevel === year);
        const yearUnits = yearGroups.reduce((sum, g) => sum + g.totalUnits, 0);
        return (
          <YearBlock
            key={year}
            yearLevel={year}
            yearUnits={yearUnits}
            groups={yearGroups}
            codeById={codeById}
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
  codeById,
}: {
  yearLevel: YearLevel;
  yearUnits: number;
  groups: CurriculumGroup[];
  codeById: Map<string, string>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400"
      >
        <span className="font-body text-base font-semibold text-navy-700 dark:text-white">
          {YEAR_LEVEL_LABELS[yearLevel]}
        </span>
        <span className="flex items-center gap-2">
          <Badge tone="navy">{yearUnits} units</Badge>
          <span className="text-slate-400 dark:text-slate-500">
            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 dark:border-white/8">
          <div className="grid grid-cols-2 gap-5">
            {groups.map((group) => (
              <SemesterCard key={group.semester} group={group} codeById={codeById} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SemesterCard({ group, codeById }: { group: CurriculumGroup; codeById: Map<string, string> }) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-navy-800/60">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <span className="font-body text-sm font-semibold text-navy-700 dark:text-white">
          {SEMESTER_LABELS[group.semester]}
        </span>
      </div>
      <div className="flex-1">
        <CurriculumSubjects group={group} codeById={codeById} />
      </div>
    </div>
  );
}
