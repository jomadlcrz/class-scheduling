import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { StudentAccountRow } from "~/types/student";

/** Most recent academic record — same "last one wins" convention StudentAccountTable already uses for Program. */
function latest(student: StudentAccountRow) {
  return student.academics[student.academics.length - 1];
}

export type StudentAccountFiltersState = {
  program: string;
  yearLevel: string;
  set: string;
  studentType: string;
  enrollmentState: string;
};

export const EMPTY_STUDENT_ACCOUNT_FILTERS: StudentAccountFiltersState = {
  program: "all",
  yearLevel: "all",
  set: "all",
  studentType: "all",
  enrollmentState: "all",
};

/** Program/Year Level/Set/Student Type/Enrollment State filter row — reset per tab by the caller. */
export function useStudentAccountFilters(rows: StudentAccountRow[]) {
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
  const studentTypes = useMemo(
    () => [...new Set(rows.map((r) => latest(r)?.studentType).filter((v): v is string => Boolean(v)))].sort(),
    [rows],
  );
  const enrollmentStates = useMemo(
    () => [...new Set(rows.map((r) => latest(r)?.enrollmentState).filter((v): v is string => Boolean(v)))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const academic = latest(r);
      if (filters.program !== "all" && academic?.program !== filters.program) return false;
      if (filters.yearLevel !== "all" && String(academic?.yearLevel ?? "") !== filters.yearLevel) return false;
      if (filters.set !== "all" && academic?.set !== filters.set) return false;
      if (filters.studentType !== "all" && academic?.studentType !== filters.studentType) return false;
      if (filters.enrollmentState !== "all" && academic?.enrollmentState !== filters.enrollmentState) return false;
      return true;
    });
  }, [rows, filters]);

  const filterBar = (
    <div className="grid gap-2 sm:grid-cols-5">
      <Select
        items={[{ value: "all", label: "All Programs" }, ...programs.map((p) => ({ value: p, label: p }))]}
        value={filters.program}
        onValueChange={(v) => setFilters((f) => ({ ...f, program: v as string }))}
      >
        <SelectTrigger aria-label="Filter by program">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Programs</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={[{ value: "all", label: "All Years" }, ...yearLevelIds.map((y) => ({ value: String(y), label: yearLevelLabel(y) }))]}
        value={filters.yearLevel}
        onValueChange={(v) => setFilters((f) => ({ ...f, yearLevel: v as string }))}
      >
        <SelectTrigger aria-label="Filter by year level">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {yearLevelIds.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {yearLevelLabel(y)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={[{ value: "all", label: "All Sets" }, ...sets.map((s) => ({ value: s, label: s }))]}
        value={filters.set}
        onValueChange={(v) => setFilters((f) => ({ ...f, set: v as string }))}
      >
        <SelectTrigger aria-label="Filter by set">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sets</SelectItem>
          {sets.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={[{ value: "all", label: "All Types" }, ...studentTypes.map((t) => ({ value: t, label: t }))]}
        value={filters.studentType}
        onValueChange={(v) => setFilters((f) => ({ ...f, studentType: v as string }))}
      >
        <SelectTrigger aria-label="Filter by student type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {studentTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={[{ value: "all", label: "All States" }, ...enrollmentStates.map((s) => ({ value: s, label: s }))]}
        value={filters.enrollmentState}
        onValueChange={(v) => setFilters((f) => ({ ...f, enrollmentState: v as string }))}
      >
        <SelectTrigger aria-label="Filter by enrollment state">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All States</SelectItem>
          {enrollmentStates.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return { filtered, filterBar, resetFilters };
}
