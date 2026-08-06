import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";

export type ReenrollDirectoryRow = {
  studentProfileId: number;
  studentId: string | null;
  name: string;
  /** Program abbrev, e.g. "BSIT" — from the student's most recent academic record. */
  program: string;
  yearLevel: number;
  semesterNumber: number;
  /** "Regular" / "Irregular" as of the most recent academic record. */
  enrolledStatus: string;
  /** Backend display string, e.g. "Has an account" / "No account yet" — shown verbatim, never reworded. */
  accountStatus: string;
};

type ReenrollStep1SelectStudentProps = {
  directory: ReenrollDirectoryRow[] | null;
  selectedIds: Set<number>;
  onToggleSelect: (row: ReenrollDirectoryRow, checked: boolean) => void;
  onSelectAll: (checked: boolean, rows: ReenrollDirectoryRow[]) => void;
  programs: Program[];
  semesters: Semester[];
  academicStatuses: string[];
  onNext: () => void;
  onCancel: () => void;
};

export function ReenrollStep1SelectStudent({
  directory,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  programs,
  semesters,
  academicStatuses,
  onNext,
  onCancel,
}: ReenrollStep1SelectStudentProps) {
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [yearLevelFilter, setYearLevelFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const results = useMemo(() => {
    if (!directory) return [];
    const query = search.trim().toLowerCase();
    return directory.filter((s) => {
      if (programFilter !== "all" && s.program !== programFilter) return false;
      if (yearLevelFilter !== "all" && String(s.yearLevel) !== yearLevelFilter) return false;
      if (semesterFilter !== "all" && String(s.semesterNumber) !== semesterFilter) return false;
      if (statusFilter !== "all" && s.enrolledStatus !== statusFilter) return false;
      if (query && !s.name.toLowerCase().includes(query) && !(s.studentId ?? "").toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [directory, search, programFilter, yearLevelFilter, semesterFilter, statusFilter]);

  const allVisibleSelected = results.length > 0 && results.every((s) => selectedIds.has(s.studentProfileId));

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Search by student ID or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search students"
          className={`${inputClassName} pl-9 pr-4`}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <Select
          items={[{ value: "all", label: "All Programs" }, ...programs.map((p) => ({ value: p.abbrev, label: p.abbrev }))]}
          value={programFilter}
          onValueChange={(v) => setProgramFilter(v as string)}
        >
          <SelectTrigger aria-label="Filter by program">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.abbrev}>
                {p.abbrev}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={[{ value: "all", label: "All Year Levels" }, ...yearLevelIds.map((y) => ({ value: String(y), label: yearLevelLabel(y) }))]}
          value={yearLevelFilter}
          onValueChange={(v) => setYearLevelFilter(v as string)}
        >
          <SelectTrigger aria-label="Filter by year level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Year Levels</SelectItem>
            {yearLevelIds.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {yearLevelLabel(y)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={[{ value: "all", label: "All Semesters" }, ...semesters.map((s) => ({ value: String(s.semesterNumber), label: s.semester }))]}
          value={semesterFilter}
          onValueChange={(v) => setSemesterFilter(v as string)}
        >
          <SelectTrigger aria-label="Filter by semester">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((s) => (
              <SelectItem key={s.semesterNumber} value={String(s.semesterNumber)}>
                {s.semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={[{ value: "all", label: "All Enrolled Status" }, ...academicStatuses.map((s) => ({ value: s, label: s }))]}
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as string)}
        >
          <SelectTrigger aria-label="Filter by enrolled status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Enrolled Status</SelectItem>
            {academicStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        {directory === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center font-body text-sm text-slate-500 dark:text-slate-400">
            No students match your search and filters.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableHeader className="w-10">
                <Checkbox
                  id="reenroll-select-all"
                  ariaLabel="Select all students"
                  inset
                  checked={allVisibleSelected}
                  onChange={(checked) => onSelectAll(checked, results)}
                />
              </TableHeader>
              <TableHeader>Student ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="hidden sm:table-cell">Program</TableHeader>
              <TableHeader className="hidden md:table-cell">Year Level</TableHeader>
              <TableHeader className="hidden md:table-cell">Enrolled Status</TableHeader>
              <TableHeader className="hidden lg:table-cell">Account</TableHeader>
            </TableHead>
            <TableBody>
              {results.map((row) => {
                const isChecked = selectedIds.has(row.studentProfileId);
                return (
                  <TableRow key={row.studentProfileId}>
                    <TableCell>
                      <Checkbox
                        id={`reenroll-student-${row.studentProfileId}`}
                        ariaLabel={`Select ${row.name}`}
                        inset
                        checked={isChecked}
                        onChange={(checked) => onToggleSelect(row, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{row.studentId ?? "—"}</TableCell>
                    <TableCell>
                      <span className="font-medium text-navy-700 dark:text-mist-100">{row.name}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{row.program || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{row.yearLevel || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{row.enrolledStatus || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge tone="slate">{row.accountStatus}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <ProgramWizardFooter
        backLabel="Cancel"
        onBack={onCancel}
        primaryLabel="Next: Enrollment Information"
        onPrimary={onNext}
        primaryDisabled={selectedIds.size === 0}
      />
    </div>
  );
}
