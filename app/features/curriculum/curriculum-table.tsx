import { useMemo } from "react";
import { AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/feedback/empty-state";
import { CurriculumSubjects } from "~/features/curriculum/curriculum-subjects";
import { SubjectCardGrid } from "~/features/curriculum/subject-card-grid";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import type { CurriculumGroup, ProgramCurriculum } from "~/types/curriculum";
import type { YearLevel } from "~/types/subject";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";

type CurriculumTableProps = {
  curriculum: ProgramCurriculum;
  /** Filters visible subjects by code/title match; matching sections auto-expand. */
  search?: string;
  viewMode?: ScheduleViewMode;
};

export function CurriculumTable({ curriculum, search = "", viewMode = "table" }: CurriculumTableProps) {
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
            viewMode={viewMode}
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
  viewMode,
}: {
  yearLevel: YearLevel;
  yearUnits: number;
  groups: CurriculumGroup[];
  forceOpen: boolean;
  viewMode: ScheduleViewMode;
}) {
  const { yearLevelLabel } = useYearLevels();
  return (
    <AccordionItem
      open={forceOpen || undefined}
      defaultOpen
      title={
        <span className="font-body text-base font-semibold text-navy-700 dark:text-mist-100">
          {yearLevelLabel(yearLevel)}
        </span>
      }
      adornment={<Badge tone="gold">{yearUnits} units</Badge>}
    >
      <div className="p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {groups.map((group) => (
            <SemesterCard key={group.semester} group={group} viewMode={viewMode} />
          ))}
        </div>
      </div>
    </AccordionItem>
  );
}

function SemesterCard({ group, viewMode }: { group: CurriculumGroup; viewMode: ScheduleViewMode }) {
  const { semesterLabel } = useSemesters();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-2">
        <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
          {semesterLabel(group.semester)}
        </p>
        {viewMode === "grid" && group.subjects.length > 0 && (
          <Badge tone="slate">{group.totalUnits} units</Badge>
        )}
      </div>
      {viewMode === "grid" ? (
        <SubjectCardGrid subjects={group.subjects} />
      ) : (
        <CurriculumSubjects group={group} />
      )}
    </div>
  );
}
