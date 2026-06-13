import { Badge } from "../../components/ui/badge";
import { EditIcon, TrashIcon } from "../../components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { getBuildingTone } from "../../types/building";
import { getProgramTone, type Program } from "../../types/program";
import { DAY_SHORT, formatTime, type Schedule } from "../../types/schedule";
import { YEAR_LEVEL_LABELS } from "../../types/subject";

type ScheduleTableProps = {
  schedules: Schedule[];
  programs: Program[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function ScheduleTable({ schedules, programs, onEdit, onDelete }: ScheduleTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Subject</TableHeader>
        <TableHeader className="hidden sm:table-cell">Set</TableHeader>
        <TableHeader className="hidden md:table-cell">Faculty</TableHeader>
        <TableHeader className="hidden sm:table-cell">Room</TableHeader>
        <TableHeader>Day</TableHeader>
        <TableHeader>Time</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {schedules.map((sched) => (
          <TableRow key={sched.id}>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-navy-700 dark:text-white">{sched.subjectCode}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{sched.subjectTitle}</span>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <div className="flex items-center gap-1.5">
                <Badge tone={getProgramTone(sched.program, programs)}>{sched.program}</Badge>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {YEAR_LEVEL_LABELS[sched.yearLevel as 1]} · {sched.setCode}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="text-sm">{sched.facultyName}</span>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <div className="flex items-center gap-1.5">
                <Badge tone={getBuildingTone(sched.buildingCode)}>{sched.buildingCode}</Badge>
                <span className="text-sm text-slate-600 dark:text-slate-300">{sched.roomName}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{DAY_SHORT[sched.day]}</span>
            </TableCell>
            <TableCell>
              <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                {formatTime(sched.startTime)} – {formatTime(sched.endTime)}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(sched)}
                  aria-label={`Edit ${sched.subjectCode} ${sched.setCode}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(sched)}
                  aria-label={`Delete ${sched.subjectCode} ${sched.setCode}`}
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
