import { Badge, type BadgeTone } from "../../components/ui/badge";
import { EditIcon, TrashIcon } from "../../components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { SEMESTER_LABELS, YEAR_LEVEL_LABELS, type Subject } from "../../types/subject";
import { SET_STATUS_LABELS, type ClassSet, type SetStatus } from "../../types/set";

type SetTableProps = {
  sets: ClassSet[];
  allSubjects: Subject[];
  onEdit: (set: ClassSet) => void;
  onDelete: (set: ClassSet) => void;
};

const statusTone: Record<SetStatus, BadgeTone> = {
  open: "emerald",
  closed: "slate",
  cancelled: "red",
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function SetTable({ sets, allSubjects, onEdit, onDelete }: SetTableProps) {
  const subjectById = new Map(allSubjects.map((s) => [s.id, s]));

  return (
    <Table>
      <TableHead>
        <TableHeader>Set</TableHeader>
        <TableHeader>Subject</TableHeader>
        <TableHeader className="hidden sm:table-cell">Program</TableHeader>
        <TableHeader className="hidden sm:table-cell">Year & Semester</TableHeader>
        <TableHeader className="hidden md:table-cell">School Year</TableHeader>
        <TableHeader className="hidden md:table-cell">Capacity</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {sets.map((set) => {
          const subject = subjectById.get(set.subjectId);
          return (
            <TableRow key={set.id}>
              <TableCell>
                <span className="font-medium text-navy-700 dark:text-white">{set.setCode}</span>
              </TableCell>
              <TableCell>
                {subject ? (
                  <span>
                    <span className="font-medium text-navy-700 dark:text-white">
                      {subject.code}
                    </span>
                    <span className="ml-1.5 text-slate-500 dark:text-slate-400">
                      — {subject.title}
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-600">Unknown subject</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {subject ? (
                  <Badge tone="navy">{subject.program}</Badge>
                ) : (
                  <span className="text-slate-400 dark:text-slate-600">—</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {subject ? (
                  <>
                    {YEAR_LEVEL_LABELS[subject.yearLevel]} · {SEMESTER_LABELS[set.semester]}
                  </>
                ) : (
                  SEMESTER_LABELS[set.semester]
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">{set.schoolYear}</TableCell>
              <TableCell className="hidden md:table-cell">{set.capacity}</TableCell>
              <TableCell>
                <Badge tone={statusTone[set.status]}>{SET_STATUS_LABELS[set.status]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(set)}
                    aria-label={`Edit set ${set.setCode}`}
                    title="Edit"
                    className={actionButtonClassName}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(set)}
                    aria-label={`Delete set ${set.setCode}`}
                    title="Delete"
                    className={actionButtonClassName}
                  >
                    <TrashIcon />
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
