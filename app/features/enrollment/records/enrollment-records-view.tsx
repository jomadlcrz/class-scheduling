import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { ChevronRightIcon, SearchIcon, UserIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { EnrollmentDetailDrawer } from "~/features/enrollment/records/enrollment-detail-drawer";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { EnrollmentFacets, EnrollmentRow, EnrollmentStudent } from "~/types/enrollment";

const STATE_TONES: Record<string, BadgeTone> = {
  Enrolled: "emerald",
  Dropped: "red",
  Withdrawn: "gold",
  Voided: "slate",
};

const STATE_SEGMENTS: { value: string; label: string; countKey: keyof EnrollmentFacets["counts"] }[] = [
  { value: "Enrolled", label: "Enrolled", countKey: "enrolled" },
  { value: "Dropped", label: "Dropped", countKey: "dropped" },
  { value: "Withdrawn", label: "Withdrawn", countKey: "withdrawn" },
  { value: "Voided", label: "Voided", countKey: "voided" },
];

type DisplayRow = { key: string; student: EnrollmentStudent; enrollment: EnrollmentRow };

function accountTone(status: string): BadgeTone {
  return status.toLowerCase().includes("no") ? "slate" : "emerald";
}

function segmentClass(active: boolean): string {
  return `rounded-full border px-3 py-1 font-body text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gwc-blue/40 ${
    active
      ? "border-gwc-blue bg-gwc-blue text-white"
      : "border-slate-300 text-slate-600 hover:border-gwc-blue/50 hover:text-navy-700 dark:border-white/15 dark:text-slate-300 dark:hover:text-mist-100"
  }`;
}

type Props = {
  students: EnrollmentStudent[];
  facets: EnrollmentFacets | null;
  onChanged: () => void;
  /** Preselect the Type segment (used by the regular/irregular redirect links). */
  initialType?: string;
};

export function EnrollmentRecordsView({ students, facets, onChanged, initialType = "all" }: Props) {
  const { yearLevelIds, yearLevelLabel } = useYearLevels();

  const [typeFilter, setTypeFilter] = useState(initialType);
  const [stateFilter, setStateFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [setFilter, setSetFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DisplayRow | null>(null);

  const rows = useMemo<DisplayRow[]>(
    () =>
      students.flatMap((student) =>
        student.enrollments.map((enrollment) => ({
          key: String(enrollment.enrollmentId),
          student,
          enrollment,
        })),
      ),
    [students],
  );

  const programs = facets?.programs ?? [];
  const sets = facets?.sets ?? [];
  const counts = facets?.counts;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(({ student, enrollment }) => {
      if (typeFilter !== "all" && enrollment.enrolledStatus !== typeFilter) return false;
      if (stateFilter !== "all" && enrollment.enrollmentState !== stateFilter) return false;
      if (programFilter !== "all" && enrollment.program !== programFilter) return false;
      if (yearFilter !== "all" && String(enrollment.yearLevel) !== yearFilter) return false;
      if (setFilter !== "all" && enrollment.set !== setFilter) return false;
      if (
        query &&
        !student.name.toLowerCase().includes(query) &&
        !(student.studentId ?? "").toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, typeFilter, stateFilter, programFilter, yearFilter, setFilter, search]);

  return (
    <div className="flex flex-col gap-4">
      {/* Type + State facet segments with live term counts */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={segmentClass(typeFilter === "all")} onClick={() => setTypeFilter("all")}>
            All{counts ? ` · ${counts.total}` : ""}
          </button>
          <button type="button" className={segmentClass(typeFilter === "Regular")} onClick={() => setTypeFilter("Regular")}>
            Regular{counts ? ` · ${counts.regular}` : ""}
          </button>
          <button
            type="button"
            className={segmentClass(typeFilter === "Irregular")}
            onClick={() => setTypeFilter("Irregular")}
          >
            Irregular{counts ? ` · ${counts.irregular}` : ""}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={segmentClass(stateFilter === "all")} onClick={() => setStateFilter("all")}>
            Any state
          </button>
          {STATE_SEGMENTS.map((seg) => (
            <button
              key={seg.value}
              type="button"
              className={segmentClass(stateFilter === seg.value)}
              onClick={() => setStateFilter(seg.value)}
            >
              {seg.label}
              {counts ? ` · ${counts[seg.countKey]}` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Search + program / year / set */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
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
        <div className="grid grid-cols-3 gap-2 sm:w-auto">
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
            value={yearFilter}
            onValueChange={(v) => setYearFilter(v as string)}
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
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-2 py-10 text-center font-body text-sm text-slate-500 dark:text-slate-400">
          {rows.length === 0
            ? "No enrollments for this term yet."
            : "No students match your search and filters."}
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableHeader dense>Student</TableHeader>
            <TableHeader dense>Student ID</TableHeader>
            <TableHeader dense className="hidden sm:table-cell">Program</TableHeader>
            <TableHeader dense className="hidden md:table-cell">Year</TableHeader>
            <TableHeader dense className="hidden md:table-cell">Section</TableHeader>
            <TableHeader dense className="hidden lg:table-cell">Type</TableHeader>
            <TableHeader dense>State</TableHeader>
            <TableHeader dense className="hidden lg:table-cell">Account</TableHeader>
            <TableHeader dense>
              <span className="sr-only">Open</span>
            </TableHeader>
          </TableHead>
          <TableBody>
            {filtered.map((row) => {
              const { student, enrollment } = row;
              return (
                <TableRow
                  key={row.key}
                  onClick={() => setSelected(row)}
                  className="cursor-pointer"
                >
                  <TableCell dense>
                    <div className="flex items-center gap-2">
                      {student.profilePhotoUrl ? (
                        <img
                          src={student.profilePhotoUrl}
                          alt={student.name}
                          className="size-6 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500">
                          <UserIcon />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-body text-xs font-medium text-navy-700 dark:text-mist-100">
                          {student.name}
                        </p>
                        {student.email && (
                          <p className="truncate font-body text-[0.7rem] text-slate-400 dark:text-slate-500">
                            {student.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell dense className="text-xs text-slate-600 dark:text-slate-300">
                    {student.studentId ?? "—"}
                  </TableCell>
                  <TableCell dense className="hidden text-xs sm:table-cell">
                    {enrollment.program || "—"}
                  </TableCell>
                  <TableCell dense className="hidden text-xs md:table-cell">
                    {enrollment.yearLevel || "—"}
                  </TableCell>
                  <TableCell dense className="hidden text-xs md:table-cell">
                    {enrollment.set ?? "—"}
                  </TableCell>
                  <TableCell dense className="hidden text-xs lg:table-cell">
                    {enrollment.enrolledStatus}
                  </TableCell>
                  <TableCell dense>
                    <Badge tone={STATE_TONES[enrollment.enrollmentState] ?? "slate"}>
                      {enrollment.enrollmentState}
                    </Badge>
                  </TableCell>
                  <TableCell dense className="hidden lg:table-cell">
                    <Badge tone={accountTone(student.accountStatus)}>{student.accountStatus}</Badge>
                  </TableCell>
                  <TableCell dense className="text-slate-300 dark:text-slate-600">
                    <ChevronRightIcon />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <EnrollmentDetailDrawer
        student={selected?.student ?? null}
        enrollment={selected?.enrollment ?? null}
        onClose={() => setSelected(null)}
        onChanged={onChanged}
      />
    </div>
  );
}
