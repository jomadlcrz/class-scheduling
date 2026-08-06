import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { SearchIcon, UserIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useYearLevels } from "~/hooks/use-year-levels";

/** Normalized row shared by the Regular and Irregular Students pages — both list the same
 * underlying `student_academics` shape, just filtered by `enrolledStatus` on the backend. */
export type StudentDirectoryRow = {
  studentProfileId: number;
  studentId: string | null;
  name: string;
  email: string | null;
  mobile: string | null;
  profilePhotoUrl?: string | null;
  program: string;
  yearLevel: number;
  set: string | null;
  studentType: string;
  enrollmentState: string;
  /** Backend display string, e.g. "Has an account" / "No account yet" — shown verbatim, never reworded. */
  accountStatus: string;
};

const ENROLLMENT_STATE_TONES: Record<string, BadgeTone> = {
  Enrolled: "emerald",
  Dropped: "red",
  Withdrawn: "gold",
  Voided: "slate",
};

function accountStatusTone(accountStatus: string): BadgeTone {
  return accountStatus.toLowerCase().includes("no") ? "slate" : "emerald";
}

type StudentDirectoryTableProps = {
  rows: StudentDirectoryRow[];
  emptyMessage: string;
};

/** Search box + Program/Year Level/Set/Student Type/Enrollment State filters, and the detailed table below them. */
export function StudentDirectoryTable({ rows, emptyMessage }: StudentDirectoryTableProps) {
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [yearLevelFilter, setYearLevelFilter] = useState("all");
  const [setFilter, setSetFilter] = useState("all");
  const [studentTypeFilter, setStudentTypeFilter] = useState("all");
  const [enrollmentStateFilter, setEnrollmentStateFilter] = useState("all");

  const programs = useMemo(() => [...new Set(rows.map((r) => r.program).filter(Boolean))].sort(), [rows]);
  const sets = useMemo(() => [...new Set(rows.map((r) => r.set).filter((s): s is string => Boolean(s)))].sort(), [rows]);
  const studentTypes = useMemo(() => [...new Set(rows.map((r) => r.studentType).filter(Boolean))].sort(), [rows]);
  const enrollmentStates = useMemo(
    () => [...new Set(rows.map((r) => r.enrollmentState).filter(Boolean))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (programFilter !== "all" && r.program !== programFilter) return false;
      if (yearLevelFilter !== "all" && String(r.yearLevel) !== yearLevelFilter) return false;
      if (setFilter !== "all" && r.set !== setFilter) return false;
      if (studentTypeFilter !== "all" && r.studentType !== studentTypeFilter) return false;
      if (enrollmentStateFilter !== "all" && r.enrollmentState !== enrollmentStateFilter) return false;
      if (query && !r.name.toLowerCase().includes(query) && !(r.studentId ?? "").toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [rows, search, programFilter, yearLevelFilter, setFilter, studentTypeFilter, enrollmentStateFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Search by name or student ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search students"
          className={`${inputClassName} pl-9 pr-4`}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        <Select
          items={[{ value: "all", label: "All Programs" }, ...programs.map((p) => ({ value: p, label: p }))]}
          value={programFilter}
          onValueChange={(v) => setProgramFilter(v as string)}
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
          value={yearLevelFilter}
          onValueChange={(v) => setYearLevelFilter(v as string)}
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
          value={setFilter}
          onValueChange={(v) => setSetFilter(v as string)}
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
          value={studentTypeFilter}
          onValueChange={(v) => setStudentTypeFilter(v as string)}
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
          value={enrollmentStateFilter}
          onValueChange={(v) => setEnrollmentStateFilter(v as string)}
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

      {filtered.length === 0 ? (
        <p className="px-2 py-10 text-center font-body text-sm text-slate-500 dark:text-slate-400">
          {rows.length === 0 ? emptyMessage : "No students match your search and filters."}
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableHeader dense>Student</TableHeader>
            <TableHeader dense>Student ID</TableHeader>
            <TableHeader dense className="hidden sm:table-cell">Program</TableHeader>
            <TableHeader dense className="hidden md:table-cell">Year Level</TableHeader>
            <TableHeader dense className="hidden md:table-cell">Set</TableHeader>
            <TableHeader dense className="hidden lg:table-cell">Student Type</TableHeader>
            <TableHeader dense>Enrollment State</TableHeader>
            <TableHeader dense className="hidden xl:table-cell">Contact</TableHeader>
            <TableHeader dense className="hidden lg:table-cell">Account</TableHeader>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.studentProfileId}>
                <TableCell dense>
                  <div className="flex items-center gap-2">
                    {r.profilePhotoUrl ? (
                      <img src={r.profilePhotoUrl} alt={r.name} className="size-6 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500">
                        <UserIcon />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-body text-xs font-medium text-navy-700 dark:text-mist-100">{r.name}</p>
                      {r.email && (
                        <p className="truncate font-body text-[0.7rem] text-slate-400 dark:text-slate-500">{r.email}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell dense className="text-xs text-slate-600 dark:text-slate-300">{r.studentId ?? "—"}</TableCell>
                <TableCell dense className="hidden text-xs sm:table-cell">{r.program || "—"}</TableCell>
                <TableCell dense className="hidden text-xs md:table-cell">{r.yearLevel || "—"}</TableCell>
                <TableCell dense className="hidden text-xs md:table-cell">{r.set ?? "—"}</TableCell>
                <TableCell dense className="hidden text-xs lg:table-cell">{r.studentType || "—"}</TableCell>
                <TableCell dense>
                  {r.enrollmentState ? (
                    <Badge tone={ENROLLMENT_STATE_TONES[r.enrollmentState] ?? "slate"}>{r.enrollmentState}</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell dense className="hidden text-xs xl:table-cell">{r.mobile ?? r.email ?? "—"}</TableCell>
                <TableCell dense className="hidden lg:table-cell">
                  <Badge tone={accountStatusTone(r.accountStatus)}>{r.accountStatus}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
