import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { IconButton } from "~/components/ui/icon-button";
import { FileSearchIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { ProfileAvatar } from "~/components/ui/profile-avatar";
import { Pagination } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { TableSkeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { EnrollmentDetailDrawer } from "~/features/enrollment/records/enrollment-detail-drawer";
import { useEnums } from "~/hooks/use-enums";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { EnrollmentFacets, EnrollmentRow, EnrollmentStudent } from "~/types/enrollment";

const STATE_TONES: Record<string, BadgeTone> = {
  Enrolled: "emerald",
  Dropped: "red",
  Withdrawn: "gold",
  Voided: "slate",
};

const TYPE_TONES: Record<string, BadgeTone> = {
  Regular: "navy",
  Irregular: "slate",
};

type DisplayRow = { key: string; student: EnrollmentStudent; enrollment: EnrollmentRow };

function segmentClass(active: boolean): string {
  return `rounded-full border px-3 py-1 font-body text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gwc-blue/40 ${
    active
      ? "border-gwc-blue bg-gwc-blue text-mist-100"
      : "border-slate-300 text-slate-600 hover:border-gwc-blue/50 hover:text-navy-700 dark:border-white/15 dark:text-slate-300 dark:hover:text-mist-100"
  }`;
}

type Props = {
  students: EnrollmentStudent[] | null;
  facets: EnrollmentFacets | null;
  genders: string[];
  nameSuffixes: string[];
  onChanged: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  stateFilter: string;
  onStateFilterChange: (value: string) => void;
  programFilter: string;
  onProgramFilterChange: (value: string) => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  setFilter: string;
  onSetFilterChange: (value: string) => void;
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  readOnly?: boolean;
};

export function EnrollmentRecordsView({
  students,
  facets,
  genders,
  nameSuffixes,
  onChanged,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  stateFilter,
  onStateFilterChange,
  programFilter,
  onProgramFilterChange,
  yearFilter,
  onYearFilterChange,
  setFilter,
  onSetFilterChange,
  page,
  totalItems,
  pageSize,
  onPageChange,
  readOnly = false,
}: Props) {
  const { enums } = useEnums();
  const academicStatuses = enums?.academicStatus ?? ["Regular", "Irregular"];
  const enrollmentStates = enums?.enrollmentState ?? ["Enrolled", "Dropped", "Withdrawn", "Voided"];
  const { yearLevelIds, yearLevelLabel } = useYearLevels();

  const [selected, setSelected] = useState<DisplayRow | null>(null);

  const rows = useMemo<DisplayRow[]>(
    () =>
      students?.flatMap((student) =>
        student.enrollments.map((enrollment) => ({
          key: String(enrollment.enrollmentId),
          student,
          enrollment,
        })),
      ) ?? [],
    [students],
  );

  const programs = facets?.programs ?? [];
  const sets = facets?.sets ?? [];
  const counts = facets?.counts;

  return (
    <div className="flex flex-col gap-4">
      {/* Type + State facet segments with live term counts */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={segmentClass(typeFilter === "all")} onClick={() => onTypeFilterChange("all")}>
            All{counts ? ` · ${counts.total}` : ""}
          </button>
          {academicStatuses.map((status) => {
            const count = status === "Regular" ? counts?.regular : status === "Irregular" ? counts?.irregular : undefined;
            return (
              <button
                key={status}
                type="button"
                className={segmentClass(typeFilter === status)}
                onClick={() => onTypeFilterChange(status)}
              >
                {status}{count !== undefined ? ` · ${count}` : ""}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={segmentClass(stateFilter === "all")} onClick={() => onStateFilterChange("all")}>
            Any state
          </button>
          {enrollmentStates.map((state) => {
            const countKey = state.toLowerCase() as keyof EnrollmentFacets["counts"];
            const count = counts ? counts[countKey] : undefined;
            return (
              <button
                key={state}
                type="button"
                className={segmentClass(stateFilter === state)}
                onClick={() => onStateFilterChange(state)}
              >
                {state}
                {count !== undefined ? ` · ${count}` : ""}
              </button>
            );
          })}
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
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search students"
            className={`${inputClassName} pl-9 pr-4`}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-auto">
          <Select
            items={[{ value: "all", label: "All Programs" }, ...programs.map((p) => ({ value: p, label: p }))]}
            value={programFilter}
            onValueChange={(v) => onProgramFilterChange(v as string)}
          >
            <SelectTrigger aria-label="Filter by program">
              <SelectValue placeholder="All Programs" />
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
            onValueChange={(v) => onYearFilterChange(v as string)}
          >
            <SelectTrigger aria-label="Filter by year level">
              <SelectValue placeholder="All Years" />
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
            onValueChange={(v) => onSetFilterChange(v as string)}
          >
            <SelectTrigger aria-label="Filter by set">
              <SelectValue placeholder="All Sets" />
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

      {students === null ? (
        <TableSkeleton columns={9} rows={8} />
      ) : rows.length === 0 ? (
        <p className="px-2 py-10 text-center font-body text-sm text-slate-500 dark:text-slate-400">
          {search.trim() || typeFilter !== "all" || stateFilter !== "all" || programFilter !== "all" || yearFilter !== "all" || setFilter !== "all"
            ? "No students match your search and filters."
            : "No enrollments for this term yet."}
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableHeader dense>Student</TableHeader>
            <TableHeader dense>Student ID</TableHeader>
            <TableHeader dense className="hidden sm:table-cell">Program</TableHeader>
            <TableHeader dense className="hidden md:table-cell">Year</TableHeader>
            <TableHeader dense className="hidden md:table-cell">Set</TableHeader>
            <TableHeader dense className="hidden lg:table-cell">Type</TableHeader>
            <TableHeader dense>State</TableHeader>
            <TableHeader dense className="hidden lg:table-cell">Account</TableHeader>
            <TableHeader dense>
              <span className="sr-only">Open</span>
            </TableHeader>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const { student, enrollment } = row;
              return (
                <TableRow key={row.key}>
                  <TableCell dense>
                    <div className="flex items-center gap-2">
                      {student.profilePhotoUrl ? (
                        <img
                          src={student.profilePhotoUrl}
                          alt={student.name}
                          className="size-6 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <ProfileAvatar gender={student.gender} className="size-6" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-body text-xs font-medium text-navy-700 dark:text-mist-100">
                          {student.name}
                        </p>
                        {student.email && (
                          <a
                            href={`mailto:${student.email}`}
                            className="block truncate font-body text-[0.7rem] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                          >
                            {student.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell dense className="text-xs text-slate-600 dark:text-slate-300">
                    {student.studentId || "No ID"}
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
                    <Badge tone={TYPE_TONES[enrollment.enrolledStatus] ?? "slate"}>
                      {enrollment.enrolledStatus}
                    </Badge>
                  </TableCell>
                  <TableCell dense>
                    <Badge tone={STATE_TONES[enrollment.enrollmentState] ?? "slate"}>
                      {enrollment.enrollmentState}
                    </Badge>
                  </TableCell>
                  <TableCell dense className="hidden text-xs text-slate-500 lg:table-cell dark:text-slate-400">
                    {student.accountStatus}
                  </TableCell>
                  <TableCell dense>
                    <div className="flex justify-end">
                      <IconButton onClick={() => setSelected(row)} label={`View ${student.name}`} title="View details">
                        <FileSearchIcon />
                      </IconButton>
                    </div>
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
        genders={genders}
        nameSuffixes={nameSuffixes}
        onClose={() => setSelected(null)}
        onChanged={onChanged}
        readOnly={readOnly}
      />

      <Pagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  );
}
