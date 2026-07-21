import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { EditIcon, EyeIcon, TrashIcon } from "~/components/ui/icons";
import { facultyKey } from "~/lib/faculty-load";
import type { FacultyLoadInput, FacultyLoadingEntry } from "~/types/faculty-load";

export type FacultyLoadSubjectDetail = {
  subjectCode: string;
  descriptiveTitle: string;
  units: number | null;
  /** Staged (not-yet-saved) rows know the program they were assigned under. */
  programAbbrev?: string;
  /** Saved rows carry the actual scheduled sessions (GET /deans/faculty-loading). */
  schedules?: { day: string; time: string; room: string | null; course: string }[];
};

export type FacultyLoadRow = {
  key: string;
  fullName: string;
  programs: string[];
  subjectCount: number;
  totalUnits: number;
  maxWeeklyHours?: number;
  subjects: FacultyLoadSubjectDetail[];
};

/** Shapes one staged (not-yet-saved) assignment for display, resolving unit counts by "PROGRAM CODE" key. */
export function toFacultyLoadRow(entry: FacultyLoadInput, unitsByKey: Map<string, number>): FacultyLoadRow {
  const subjects: FacultyLoadSubjectDetail[] = entry.programs.flatMap((p) =>
    p.subjects.map((s) => ({
      subjectCode: s.subjectCode,
      descriptiveTitle: s.descriptiveTitle,
      units: unitsByKey.get(`${p.programAbbrev} ${s.subjectCode}`) ?? null,
      programAbbrev: p.programAbbrev,
    })),
  );

  return {
    key: facultyKey(entry.firstName, entry.lastName),
    fullName: `${entry.firstName} ${entry.lastName}`,
    programs: entry.programs.map((p) => p.programAbbrev),
    subjectCount: subjects.length,
    totalUnits: subjects.reduce((sum, s) => sum + (s.units ?? 0), 0),
    maxWeeklyHours: entry.maxWeeklyHours,
    subjects,
  };
}

/** Shapes an already-saved faculty loading entry (GET /deans/faculty-loading) for display. */
export function toExistingFacultyLoadRow(entry: FacultyLoadingEntry): FacultyLoadRow {
  return {
    key: entry.instructorName,
    fullName: entry.instructorName,
    programs: [...new Set(entry.subjects.flatMap((s) => s.schedules.map((sc) => sc.course)))],
    subjectCount: entry.subjects.length,
    totalUnits: entry.subjects.reduce((sum, s) => sum + s.units.total, 0),
    maxWeeklyHours: entry.maxWeeklyHours ?? undefined,
    subjects: entry.subjects.map((s) => ({
      subjectCode: s.subjectCode,
      descriptiveTitle: s.descriptiveTitle,
      units: s.units.total,
      schedules: s.schedules.map((sc) => ({
        day: sc.day,
        time: sc.time,
        room: sc.room,
        course: sc.course,
      })),
    })),
  };
}

type FacultyLoadTableProps = {
  rows: FacultyLoadRow[];
  /** Omit all three to render a fully read-only table. */
  onEdit?: (key: string) => void;
  onRemove?: (key: string) => void;
  onViewSubjects?: (row: FacultyLoadRow) => void;
};

const actionButtonClassName =
  "cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

/** Shared table for both the staged batch (editable) and existing saved loads (read-only). */
export function FacultyLoadTable({ rows, onEdit, onRemove, onViewSubjects }: FacultyLoadTableProps) {
  const showActions = Boolean(onEdit || onRemove || onViewSubjects);

  return (
    <Table>
      <TableHead>
        <TableHeader>Faculty</TableHeader>
        <TableHeader>Programs</TableHeader>
        <TableHeader>Subjects</TableHeader>
        <TableHeader>Units</TableHeader>
        <TableHeader className="hidden sm:table-cell">Max Weekly Hours</TableHeader>
        {showActions && (
          <TableHeader>
            <span className="sr-only">Actions</span>
          </TableHeader>
        )}
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{row.fullName}</span>
            </TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300">
              {row.programs.join(", ") || "—"}
            </TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300">{row.subjectCount}</TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300">{row.totalUnits}</TableCell>
            <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
              {row.maxWeeklyHours != null ? `${row.maxWeeklyHours} hrs` : "—"}
            </TableCell>
            {showActions && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  {onViewSubjects && (
                    <button
                      type="button"
                      onClick={() => onViewSubjects(row)}
                      aria-label={`View subjects for ${row.fullName}`}
                      title="View subjects"
                      className={actionButtonClassName}
                    >
                      <EyeIcon />
                    </button>
                  )}
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(row.key)}
                      aria-label={`Edit ${row.fullName}`}
                      title="Edit"
                      className={actionButtonClassName}
                    >
                      <EditIcon />
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(row.key)}
                      aria-label={`Remove ${row.fullName}`}
                      title="Remove"
                      className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
