import { Badge } from "~/components/ui/badge";
import type { BadgeTone } from "~/components/ui/badge";
import { EditIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { Program, ProgramType } from "~/types/program";
import { PROGRAM_TYPE_LABELS } from "~/types/program";
import type { Student } from "~/types/student";
import { STUDENT_STATUS_LABELS } from "~/types/student";
import { YEAR_LEVEL_LABELS } from "~/types/subject";

type StudentTableProps = {
  students: Student[];
  programs: Program[];
  onEdit: (student: Student) => void;
  onToggleStatus: (student: Student) => void;
};

const STATUS_TONES: Record<Student["status"], BadgeTone> = {
  enrolled: "emerald",
  inactive: "slate",
  graduated: "navy",
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function StudentTable({ students, programs, onEdit, onToggleStatus }: StudentTableProps) {
  function getProgram(code: string) {
    return programs.find((p) => p.code === code);
  }

  return (
    <Table>
      <TableHead>
        <TableHeader>Student No.</TableHeader>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Email</TableHeader>
        <TableHeader>Program</TableHeader>
        <TableHeader className="hidden md:table-cell">Year / Section</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {students.map((s) => {
          const program = getProgram(s.program);
          return (
            <TableRow key={s.id}>
              <TableCell>
                <span className="font-medium text-navy-700 dark:text-white">
                  {s.studentNumber}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-navy-700 dark:text-white">
                  {s.lastName}, {s.firstName}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
                {s.email}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {program && (
                    <img
                      src={`/images/departments/${program.departmentCode.toLowerCase()}.avif`}
                      alt={`${program.departmentCode} logo`}
                      className="size-8 rounded-lg object-contain"
                    />
                  )}
                  <div>
                    <span className="font-medium text-navy-700 dark:text-white">
                      {s.program}
                    </span>
                    {program && (
                      <span className="ml-1.5 text-slate-500 dark:text-slate-400">
                        {PROGRAM_TYPE_LABELS[program.type]}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-slate-500 dark:text-slate-400">
                {YEAR_LEVEL_LABELS[s.yearLevel]} — {s.setCode}
              </TableCell>
              <TableCell>
                <Badge tone={STATUS_TONES[s.status]}>{STUDENT_STATUS_LABELS[s.status]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    aria-label={`Edit ${s.firstName} ${s.lastName}`}
                    title="Edit"
                    className={actionButtonClassName}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(s)}
                    aria-label={
                      s.status === "enrolled"
                        ? `Deactivate ${s.firstName} ${s.lastName}`
                        : `Activate ${s.firstName} ${s.lastName}`
                    }
                    title={s.status === "enrolled" ? "Deactivate" : "Activate"}
                    className={actionButtonClassName}
                  >
                    {s.status === "enrolled" ? <UserOffIcon /> : <UserCheckIcon />}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
