import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { AccordionItem } from "~/components/ui/accordion";
import {
  AlertTriangleIcon,
  CheckIcon,
  EditIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
} from "~/components/ui/icons";
import { ProgramTablePanel } from "./program-table-panel";

type InstructorData = {
  id: string;
  name: string;
  facultyId: string;
  department: string;
  statusBadge: string;
  maxWeeklyHours: number | null;
  avatarUrl?: string;
  programs: {
    id: string;
    programAbbrev: string;
    programName: string;
    subjects: {
      subjectCode: string;
      descriptiveTitle: string;
      units: number;
      lecHours: number;
      labHours: number;
      weeklyHours: number;
    }[];
  }[];
};

type InstructorCardProps = {
  instructor: InstructorData;
  defaultOpen?: boolean;
  onMaxHoursChange: (hours: number | null) => void;
  onAddProgram: () => void;
  onAssignSubject: (programId: string) => void;
  onRemoveSubject: (programId: string, subjectCode: string) => void;
  onUpdateAssignment: () => void;
  onViewTeachingTerm?: () => void;
  onRemoveInstructor: () => void;
};

export function InstructorCard({
  instructor,
  defaultOpen,
  onMaxHoursChange,
  onAddProgram,
  onAssignSubject,
  onRemoveSubject,
  onUpdateAssignment,
  onViewTeachingTerm,
  onRemoveInstructor,
}: InstructorCardProps) {
  const assignedHours = instructor.programs.reduce(
    (sum, p) => sum + p.subjects.reduce((sSum, s) => sSum + s.weeklyHours, 0),
    0,
  );
  const maxHours = instructor.maxWeeklyHours;
  const remainingHours = maxHours != null ? maxHours - assignedHours : null;

  let statusBadgeType: "within" | "approaching" | "exceeds" = "within";
  if (maxHours != null) {
    if (assignedHours > maxHours) {
      statusBadgeType = "exceeds";
    } else if (remainingHours != null && remainingHours <= 3 && remainingHours >= 0) {
      statusBadgeType = "approaching";
    }
  }

  const progressPercent = maxHours != null && maxHours > 0 ? Math.min(100, Math.round((assignedHours / maxHours) * 100)) : 0;

  return (
    <AccordionItem
      defaultOpen={defaultOpen}
      title={
        <div className="flex items-center gap-3.5">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={instructor.name}
              className="size-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-white/10"
            />
          ) : (
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-sm font-bold text-white dark:bg-white dark:text-navy-900">
              {instructor.name.charAt(0)}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-body text-base font-bold text-navy-900 dark:text-white">
                {instructor.name}
              </h3>
              <Badge tone="emerald">{instructor.statusBadge}</Badge>
            </div>
            <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
              Employee ID: <span className="font-medium text-slate-700 dark:text-slate-300">{instructor.facultyId}</span>
              <span className="mx-2">•</span>
              Department: <span className="font-medium text-slate-700 dark:text-slate-300">{instructor.department}</span>
            </p>
          </div>
        </div>
      }
      adornment={
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <span className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">
              Max Weekly Hours
            </span>
            <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-xs dark:border-white/15 dark:bg-white/5">
              <input
                type="number"
                min="0"
                placeholder="—"
                value={maxHours ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onMaxHoursChange(v === "" ? null : Math.max(0, parseInt(v) || 0));
                }}
                className="w-12 py-1 text-center font-body text-xs font-bold text-navy-800 placeholder:text-slate-300 focus:outline-none dark:text-white dark:placeholder:text-slate-600"
              />
              <span className="border-l border-slate-200 px-2 py-1 font-body text-xs text-slate-400 dark:border-white/10">
                hrs
              </span>
            </div>
          </div>

          <div className="flex flex-col min-w-0 sm:min-w-36 sm:flex-1">
            <div className="flex items-center justify-between font-body text-xs">
              <span className="text-slate-500 dark:text-slate-400">Assigned Hours</span>
              <span className="font-bold text-navy-800 dark:text-white">
                {assignedHours}{maxHours != null ? ` / ${maxHours}` : ""} hrs
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  statusBadgeType === "exceeds"
                    ? "bg-red-500 dark:bg-red-500"
                    : statusBadgeType === "approaching"
                    ? "bg-amber-500 dark:bg-amber-500"
                    : "bg-emerald-500 dark:bg-emerald-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col font-body text-xs">
            <span className="text-slate-500 dark:text-slate-400">Remaining Hours</span>
            <span
              className={`mt-0.5 font-bold ${
                remainingHours == null
                  ? "text-slate-400 dark:text-slate-500"
                  : remainingHours < 0
                  ? "text-red-600 dark:text-red-400"
                  : remainingHours <= 3
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {remainingHours != null ? `${remainingHours} hrs` : "—"}
            </span>
          </div>

          <div className="flex items-center">
            {statusBadgeType === "within" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-body text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckIcon size={14} />
                <span>Within Load</span>
              </span>
            )}
            {statusBadgeType === "approaching" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-body text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <AlertTriangleIcon />
                <span>Approaching Limit</span>
              </span>
            )}
            {statusBadgeType === "exceeds" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-body text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
                <AlertTriangleIcon />
                <span>Exceeds Load</span>
              </span>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {instructor.programs.map((prog) => (
          <ProgramTablePanel
            key={prog.id}
            program={prog}
            onAssignSubject={() => onAssignSubject(prog.id)}
            onRemoveSubject={(code) => onRemoveSubject(prog.id, code)}
          />
        ))}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" block={false} onClick={onAddProgram}>
            <PlusIcon />
            Add Existing Program
          </Button>

          <div className="flex items-center gap-2">
            {onViewTeachingTerm && (
              <Button type="button" variant="outline" block={false} onClick={onViewTeachingTerm}>
                <EyeIcon />
                View Term
              </Button>
            )}
            <Button type="button" variant="outline" block={false} onClick={onUpdateAssignment}>
              <EditIcon />
              Update Assignment
            </Button>
            <Button type="button" variant="danger" block={false} onClick={onRemoveInstructor}>
              <TrashIcon />
              Remove Instructor
            </Button>
          </div>
        </div>
      </div>
    </AccordionItem>
  );
}
