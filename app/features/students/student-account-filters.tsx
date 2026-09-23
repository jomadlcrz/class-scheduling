import { useMemo, useState } from "react";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
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
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  serverFiltered?: boolean;
  facets?: {
    programs?: string[];
    yearLevels?: number[];
    sets?: string[];
  };
  onFilterChange?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchId?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
};

export function useStudentAccountFilters(rows: StudentAccountRow[], options?: UseStudentAccountFiltersOptions) {
  const statusFilter = options?.statusFilter ?? "all";
  const onStatusFilterChange = options?.onStatusFilterChange ?? (() => {});
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const [filters, setFilters] = useState<StudentAccountFiltersState>(EMPTY_STUDENT_ACCOUNT_FILTERS);

  function resetFilters() {
    setFilters(EMPTY_STUDENT_ACCOUNT_FILTERS);
    options?.onFilterChange?.();
  }

  function updateFilter(key: keyof StudentAccountFiltersState, val: string) {
    setFilters((prev) => ({ ...prev, [key]: val }));
    options?.onFilterChange?.();
  }

  const programs = useMemo(() => {
    if (options?.facets?.programs && options.facets.programs.length > 0) {
      return options.facets.programs;
    }
    return [...new Set(rows.map((r) => latest(r)?.program).filter((v): v is string => Boolean(v)))].sort();
  }, [rows, options?.facets?.programs]);

  const sets = useMemo(() => {
    if (options?.facets?.sets && options.facets.sets.length > 0) {
      return options.facets.sets;
    }
    return [...new Set(rows.map((r) => latest(r)?.set).filter((v): v is string => Boolean(v)))].sort();
  }, [rows, options?.facets?.sets]);

  const filtered = useMemo(() => {
    if (options?.serverFiltered) {
      return rows;
    }
    return rows.filter((r) => {
      const academic = latest(r);
      if (filters.program !== "all" && academic?.program !== filters.program) return false;
      if (filters.yearLevel !== "all" && String(academic?.yearLevel ?? "") !== filters.yearLevel) return false;
      if (filters.set !== "all" && academic?.set !== filters.set) return false;
      if (statusFilter === "active" && (r.hasAccount !== true || r.accountActive !== true)) return false;
      if (statusFilter === "no_account" && r.hasAccount) return false;
      if (statusFilter === "deactivated" && (r.hasAccount !== true || r.accountActive !== false)) return false;
      return true;
    });
  }, [rows, filters, statusFilter, options?.serverFiltered]);

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <FilterDropdown
        id="student-program-filter"
        label="Program"
        allLabel="All"
        options={programs.map((p) => ({ value: p, label: p }))}
        value={filters.program}
        onChange={(v) => updateFilter("program", v as string)}
      />
      <FilterDropdown
        id="student-year-filter"
        label="Year"
        allLabel="All"
        options={yearLevelIds.map((y) => ({ value: String(y), label: yearLevelLabel(y) }))}
        value={filters.yearLevel}
        onChange={(v) => updateFilter("yearLevel", v as string)}
      />
      <FilterDropdown
        id="student-set-filter"
        label="Set"
        allLabel="All"
        options={sets.map((s) => ({ value: s, label: s }))}
        value={filters.set}
        onChange={(v) => updateFilter("set", v as string)}
      />
      <FilterDropdown
        id="student-status-filter"
        label="Status"
        allLabel="All"
        options={[
          { value: "active", label: "Active" },
          { value: "deactivated", label: "Deactivated" },
          { value: "no_account", label: "No account" },
        ]}
        value={statusFilter}
        onChange={(v) => {
          onStatusFilterChange(v);
          options?.onFilterChange?.();
        }}
      />
      {options?.onSearchChange && (
        <div className="relative order-first w-full sm:order-0 sm:ml-auto sm:w-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            id={options.searchId ?? "student-search"}
            type="search"
            placeholder={options.searchPlaceholder ?? "Search..."}
            value={options.search ?? ""}
            onChange={(e) => options.onSearchChange!(e.target.value)}
            aria-label={options.searchLabel ?? "Search students"}
            className={`${inputClassName} pl-9 pr-4`}
          />
        </div>
      )}
    </div>
  );

  return { filtered, filterBar, resetFilters, filters };
}
