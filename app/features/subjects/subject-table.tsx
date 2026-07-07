import { useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { EditIcon, TrashIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { type Program } from "~/types/program";
import { SEMESTER_LABELS, YEAR_LEVEL_LABELS, type Subject } from "~/types/subject";

type SubjectTableProps = {
  /** Rows to display (already filtered and sorted). */
  subjects: Subject[];
  /** Full catalog, used to resolve prerequisite ids to codes. */
  allSubjects: Subject[];
  programs: Program[];
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function SubjectTable({ subjects, allSubjects, programs, onEdit, onDelete }: SubjectTableProps) {
  const codeById = useMemo(
    () => new Map(allSubjects.map((s) => [s.id, s.code])),
    [allSubjects],
  );

  const programDeptMap = useMemo(
    () => new Map(programs.map((p) => [p.code, p.departmentCode])),
    [programs],
  );

  return (
    <Table>
      <TableHead>
        <TableHeader>Subject Code</TableHeader>
        <TableHeader>Descriptive Title</TableHeader>
        <TableHeader>Program</TableHeader>
        <TableHeader className="hidden sm:table-cell">Year & Semester</TableHeader>
        <TableHeader className="hidden md:table-cell text-center">Units</TableHeader>
        <TableHeader className="hidden sm:table-cell">Type</TableHeader>
        <TableHeader className="hidden lg:table-cell">Prerequisites</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {subjects.map((subject) => (
          <TableRow key={subject.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{subject.code}</span>
            </TableCell>
            <TableCell>{subject.title}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                {programDeptMap.has(subject.program) && (
                  <img
                    src={`/images/departments/${programDeptMap.get(subject.program)!.toLowerCase()}.avif`}
                    alt={`${programDeptMap.get(subject.program)!} logo`}
                    className="size-10 rounded-lg object-contain"
                  />
                )}
                <div>
                  <span className="font-medium text-navy-700 dark:text-white">{subject.program}</span>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {YEAR_LEVEL_LABELS[subject.yearLevel]} · {SEMESTER_LABELS[subject.semester]}
            </TableCell>
            <TableCell className="hidden md:table-cell text-center">{subject.units}</TableCell>
            <TableCell className="hidden sm:table-cell">
              <SubjectTypeBadge type={subject.subjectType} />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {subject.prerequisiteIds.length === 0 ? (
                <span className="text-slate-400 dark:text-slate-600">—</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {subject.prerequisiteIds.map((id) => (
                    <Badge key={id} tone="slate">
                      {codeById.get(id) ?? id}
                    </Badge>
                  ))}
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(subject)}
                  aria-label={`Edit ${subject.code}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(subject)}
                  aria-label={`Delete ${subject.code}`}
                  title="Delete"
                  className={actionButtonClassName}
                >
                  <TrashIcon />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

