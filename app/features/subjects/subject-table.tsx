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
import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { type Program } from "~/types/program";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { Subject } from "~/types/subject";

type SubjectTableProps = {
  /** Rows to display (already filtered and sorted). */
  subjects: Subject[];
  programs: Program[];
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function SubjectTable({ subjects, programs, onEdit, onDelete }: SubjectTableProps) {
  const { semesterLabel } = useSemesters();
  const { yearLevelLabel } = useYearLevels();
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
              <span className="font-medium text-navy-700 dark:text-mist-100">{subject.code}</span>
            </TableCell>
            <TableCell>{subject.title}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                {programDeptMap.has(subject.program) && (
                  <img
                    src={departmentLogoUrl(programDeptMap.get(subject.program)!)}
                    alt={`${programDeptMap.get(subject.program)!} logo`}
                    onError={onDepartmentLogoError}
                    className="size-10 rounded-lg object-contain"
                  />
                )}
                <div>
                  <span className="font-medium text-navy-700 dark:text-mist-100">{subject.program}</span>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {yearLevelLabel(subject.yearLevel)} · {semesterLabel(subject.semester)}
            </TableCell>
            <TableCell className="hidden md:table-cell text-center">{subject.units}</TableCell>
            <TableCell className="hidden sm:table-cell">
              <SubjectTypeBadge type={subject.subjectType} />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {subject.prerequisites.length === 0 ? (
                <span className="text-slate-400 dark:text-slate-600">—</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {subject.prerequisites.map((code) => (
                    <Badge key={code} tone="slate">
                      {code}
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

