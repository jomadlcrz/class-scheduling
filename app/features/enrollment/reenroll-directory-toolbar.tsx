import { Card } from "~/components/ui/card";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { ReenrollDirectoryFilterState } from "~/features/enrollment/reenroll-step1-select-student";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";

type ReenrollDirectoryToolbarProps = {
  programs: Program[];
  semesters: Semester[];
  academicStatuses: string[];
  filters: ReenrollDirectoryFilterState;
  onFiltersChange: (patch: Partial<ReenrollDirectoryFilterState>) => void;
};

export function ReenrollDirectoryToolbar({
  programs,
  semesters,
  academicStatuses,
  filters,
  onFiltersChange,
}: ReenrollDirectoryToolbarProps) {
  const { yearLevelIds, yearLevelLabel } = useYearLevels();

  return (
    <Card className="mb-4 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-64 lg:shrink-0">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Search students..."
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
            aria-label="Search students"
            className={`${inputClassName} pl-9 pr-4`}
          />
        </div>

        <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            items={[{ value: "all", label: "All programs" }, ...programs.map((program) => ({ value: program.abbrev, label: program.abbrev }))]}
            value={filters.program}
            onValueChange={(value) => onFiltersChange({ program: value as string })}
          >
            <SelectTrigger aria-label="Filter by program"><SelectValue placeholder="All programs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map((program) => <SelectItem key={program.id} value={program.abbrev}>{program.abbrev}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            items={[{ value: "all", label: "All year levels" }, ...yearLevelIds.map((year) => ({ value: String(year), label: yearLevelLabel(year) }))]}
            value={filters.yearLevel}
            onValueChange={(value) => onFiltersChange({ yearLevel: value as string })}
          >
            <SelectTrigger aria-label="Filter by year level"><SelectValue placeholder="All year levels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All year levels</SelectItem>
              {yearLevelIds.map((year) => <SelectItem key={year} value={String(year)}>{yearLevelLabel(year)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            items={[{ value: "all", label: "All semesters" }, ...semesters.map((semester) => ({ value: String(semester.semesterNumber), label: semester.semester }))]}
            value={filters.semester}
            onValueChange={(value) => onFiltersChange({ semester: value as string })}
          >
            <SelectTrigger aria-label="Filter by semester"><SelectValue placeholder="All semesters" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {semesters.map((semester) => <SelectItem key={semester.semesterNumber} value={String(semester.semesterNumber)}>{semester.semester}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            items={[{ value: "all", label: "All enrolled statuses" }, ...academicStatuses.map((status) => ({ value: status, label: status }))]}
            value={filters.enrolledStatus}
            onValueChange={(value) => onFiltersChange({ enrolledStatus: value as string })}
          >
            <SelectTrigger aria-label="Filter by enrolled status"><SelectValue placeholder="All enrolled statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All enrolled statuses</SelectItem>
              {academicStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
