import { useMemo } from "react";
import { AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { CurriculumSubjects } from "~/features/curriculum/curriculum-subjects";
import type { CurriculumGroup, ProgramCurriculum } from "~/types/curriculum";
import type { YearLevel } from "~/types/subject";
import { SEMESTER_LABELS, YEAR_LEVEL_LABELS } from "~/types/subject";

type CurriculumTableProps = {
  curriculum: ProgramCurriculum;
  /** Filters visible subjects by code/title match; matching sections auto-expand. */
  search?: string;
};

export function CurriculumTable({ curriculum, search = "" }: CurriculumTableProps) {
  const query = search.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!query) return curriculum.groups;
    return curriculum.groups
      .map((group) => {
        const subjects = group.subjects.filter(
          (s) => s.code.toLowerCase().includes(query) || s.title.toLowerCase().includes(query),
        );
        return { ...group, subjects, totalUnits: subjects.reduce((sum, s) => sum + s.units, 0) };
      })
      .filter((group) => group.subjects.length > 0);
  }, [curriculum, query]);

  const yearLevels = [...new Set(filteredGroups.map((g) => g.yearLevel))].sort() as YearLevel[];

  if (query && yearLevels.length === 0) {
    return (
      <EmptyState title="No subjects found">
        No subjects match your search.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {yearLevels.map((year) => {
        const yearGroups = filteredGroups.filter((g) => g.yearLevel === year);
        const yearUnits = yearGroups.reduce((sum, g) => sum + g.totalUnits, 0);
        return (
          <YearBlock
            key={year}
            yearLevel={year}
            yearUnits={yearUnits}
            groups={yearGroups}
            forceOpen={query.length > 0}
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
  forceOpen,
}: {
  yearLevel: YearLevel;
  yearUnits: number;
  groups: CurriculumGroup[];
  forceOpen: boolean;
}) {
  return (
    <AccordionItem
      open={forceOpen || undefined}
      defaultOpen
      title={
        <span className="font-body text-base font-semibold text-navy-700 dark:text-white">
          {YEAR_LEVEL_LABELS[yearLevel]}
        </span>
      }
      adornment={<Badge tone="gold">{yearUnits} units</Badge>}
    >
      <div className="p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {groups.map((group) => (
            <SemesterCard key={group.semester} group={group} />
          ))}
        </div>
      </div>
    </AccordionItem>
  );
}

function SemesterCard({ group }: { group: CurriculumGroup }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-navy-800/60">
      <div className="px-3 py-2 text-center">
        <span className="font-body text-sm font-semibold text-navy-700 dark:text-white">
          {SEMESTER_LABELS[group.semester]}
        </span>
      </div>
      <div className="flex-1">
        <CurriculumSubjects group={group} />
      </div>
    </div>
  );
}
