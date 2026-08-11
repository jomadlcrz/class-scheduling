import { useMemo, useState } from "react";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { StudentAccountRow } from "~/types/student";

function latest(student: StudentAccountRow) {
  return student.academics[student.academics.length - 1];
}

export type StudentAccountFiltersState = {
  program: string;
  yearLevel: string;
  set: string;
};

export const EMPTY_STUDENT_ACCOUNT_FILTERS: StudentAccountFiltersState = {
  program: "all",
  yearLevel: "all",
  set: "all",
};

type UseStudentAccountFiltersOptions = {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
};

export function useStudentAccountFilters(rows: StudentAccountRow[], options?: UseStudentAccountFiltersOptions) {
  const statusFilter = options?.statusFilter ?? "all";
  const onStatusFilterChange = options?.onStatusFilterChange ?? (() => {});
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const [filters, setFilters] = useState<StudentAccountFiltersState>(EMPTY_STUDENT_ACCOUNT_FILTERS);

  function resetFilters() {
    setFilters(EMPTY_STUDENT_ACCOUNT_FILTERS);
  }

  const programs = useMemo(
    () => [...new Set(rows.map((r) => latest(r)?.program).filter((v): v is string => Boolean(v)))].sort(),
    [rows],
  );
  const sets = useMemo(
    () => [...new Set(rows.map((r) => latest(r)?.set).filter((v): v is string => Boolean(v)))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const academic = latest(r);
      if (filters.program !== "all" && academic?.program !== filters.program) return false;
      if (filters.yearLevel !== "all" && String(academic?.yearLevel ?? "") !== filters.yearLevel) return false;
      if (filters.set !== "all" && academic?.set !== filters.set) return false;
      if (statusFilter === "active" && !r.hasAccount) return false;
      if (statusFilter === "no_account" && r.hasAccount) return false;
      return true;
    });
  }, [rows, filters, statusFilter]);

  const filterBar = (
    <div className="flex flex-wrap items-end gap-2">
      <FilterDropdown
        id="student-program-filter"
        label="Program"
        allLabel="All"
        options={programs.map((p) => ({ value: p, label: p }))}
        value={filters.program}
        onChange={(v) => setFilters((f) => ({ ...f, program: v as string }))}
      />
      <FilterDropdown
        id="student-year-filter"
        label="Year"
        allLabel="All"
        options={yearLevelIds.map((y) => ({ value: String(y), label: yearLevelLabel(y) }))}
        value={filters.yearLevel}
        onChange={(v) => setFilters((f) => ({ ...f, yearLevel: v as string }))}
      />
      <FilterDropdown
        id="student-set-filter"
        label="Set"
        allLabel="All"
        options={sets.map((s) => ({ value: s, label: s }))}
        value={filters.set}
        onChange={(v) => setFilters((f) => ({ ...f, set: v as string }))}
      />
      <FilterDropdown
        id="student-status-filter"
        label="Status"
        allLabel="All"
        options={[
          { value: "active", label: "Active" },
          { value: "no_account", label: "No account" },
        ]}
        value={statusFilter}
        onChange={onStatusFilterChange}
      />
    </div>
  );

  return { filtered, filterBar, resetFilters };
}
