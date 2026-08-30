import { Badge, type BadgeTone } from "~/components/ui/badge";

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
import { ProfileAvatar } from "~/components/ui/profile-avatar";

type InstructorData = {
  id: string;
  name: string;
  facultyId: string;
  department: string;
  maxWeeklyHours: number | null;
  loadClassification: "underload" | "regular" | "overload" | null;
  avatarUrl?: string;
  gender?: string | null;
  programs: {
    id: string;
    programAbbrev: string;
    programName: string;
    isNew?: boolean;
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

const LOAD_BADGES: Record<NonNullable<InstructorData["loadClassification"]>, { label: string; tone: BadgeTone }> = {
  underload: { label: "Underload", tone: "gold" },
  regular: { label: "Regular", tone: "emerald" },
  overload: { label: "Overload", tone: "red" },
};

import type { HoursAdjustmentRequest } from "~/types/authority-workflow";

type InstructorCardProps = {
  instructor: InstructorData;
  hasChanges: boolean;
  onMaxHoursChange: (hours: number | null) => void;
  onAddProgram: () => void;
  onAssignSubject: (programId: string) => void;
  onRemoveSubject: (programId: string, subjectCode: string) => void;
  /** Whether the current role may remove this subject (by type). */
  canRemoveSubject?: (subjectCode: string) => boolean;
  /** The subject's type (for the Type column). */
  getSubjectType?: (subjectCode: string) => string | undefined;
  onRemoveProgram: (programId: string) => void;
  onUpdateAssignment: () => void;
  onViewTeachingTerm?: () => void;
  onViewAvatar?: () => void;
  onRemoveInstructor: () => void;
  hoursRole?: "dean" | "registrar";
  teachingTermExists?: boolean;
  hoursAdjustmentRequest?: HoursAdjustmentRequest;
  onRequestHoursAdjustment?: () => void;
  onReviewHoursAdjustment?: () => void;
};

export function InstructorCard({
  instructor,
  hasChanges,
  onMaxHoursChange,
  onAddProgram,
  onAssignSubject,
  onRemoveSubject,
  canRemoveSubject,
  getSubjectType,
  onRemoveProgram,
  onUpdateAssignment,
  onViewTeachingTerm,
  onViewAvatar,
  onRemoveInstructor,
  hoursRole,
  teachingTermExists = false,
  hoursAdjustmentRequest,
  onRequestHoursAdjustment,
  onReviewHoursAdjustment,
}: InstructorCardProps) {
  const subjectHours = new Map<string, number>();
  for (const prog of instructor.programs) {
    for (const subj of prog.subjects) {
      if (!subjectHours.has(subj.subjectCode)) {
        subjectHours.set(subj.subjectCode, subj.weeklyHours);
      }
    }
  }
  const assignedHours = [...subjectHours.values()].reduce((sum, h) => sum + h, 0);
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
  const loadBadge = instructor.loadClassification ? LOAD_BADGES[instructor.loadClassification] : null;

  return (
    <AccordionItem title={
        <div className="flex items-center gap-3.5">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={instructor.name}
              className="size-11 cursor-pointer rounded-full object-cover ring-2 ring-slate-100 dark:ring-white/10"
              onClick={(event) => {
                event.stopPropagation();
                onViewAvatar?.();
              }}
            />
          ) : <ProfileAvatar className="size-11 ring-2 ring-slate-100 dark:ring-white/10" />}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
                {instructor.name}
              </h3>
              {loadBadge && <Badge tone={loadBadge.tone}>{loadBadge.label}</Badge>}
            </div>
            <p className="mt-0.5 space-y-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
              <span className="block">
                Employee ID: <span className="font-medium text-slate-700 dark:text-slate-300">{instructor.facultyId}</span>
              </span>
              <span className="block">
                Department: <span className="font-medium text-slate-700 dark:text-slate-300">{instructor.department}</span>
              </span>
            </p>
          </div>
        </div>
      }
      adornmentPosition="below"
      adornment={
        <div
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <span className="block font-body text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Max Weekly Hours
            </span>
            <div className="mt-1 flex w-fit items-center rounded-lg border border-slate-300 bg-white shadow-xs dark:border-white/15 dark:bg-white/5">
              <input
                type="number"
                min="0"
                value={maxHours ?? ""}
                disabled={hoursRole === "registrar"}
                onChange={(e) => {
                  const v = e.target.value;
                  onMaxHoursChange(v === "" ? null : Math.max(0, parseInt(v) || 0));
                }}
                className={`w-12 py-1 text-center font-body text-xs font-bold text-navy-800 placeholder:text-slate-300 focus:outline-none dark:text-mist-100 dark:placeholder:text-slate-600 ${
                  hoursRole === "registrar" ? "cursor-not-allowed opacity-75" : ""
                }`}
              />
              <span className="border-l border-slate-200 px-2 py-1 font-body text-xs text-slate-400 dark:border-white/10">
                hrs
              </span>
            </div>
          </div>

          <div className="min-w-0 sm:min-w-36 sm:flex-1">
            <div className="flex items-center justify-between font-body text-xs">
              <span className="uppercase tracking-wide text-slate-400 dark:text-slate-500">Assigned Hours</span>
              <span className="font-bold text-navy-800 dark:text-mist-100">
                {assignedHours}{maxHours != null ? ` / ${maxHours}` : ""} hrs
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  statusBadgeType === "exceeds"
                    ? "bg-red-500 dark:bg-red-500"
                    : statusBadgeType === "approaching"
                    ? "bg-amber-500 dark:bg-amber-400"
                    : "bg-emerald-500 dark:bg-emerald-400"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col font-body text-xs">
            <span className="uppercase tracking-wide text-slate-400 dark:text-slate-500">Remaining Hours</span>
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
                <span>Within Limit</span>
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
            canRemoveSubject={canRemoveSubject}
            getSubjectType={getSubjectType}
            onAssignSubject={() => onAssignSubject(prog.id)}
            onRemoveSubject={(code) => onRemoveSubject(prog.id, code)}
            onRemoveProgram={prog.isNew ? () => onRemoveProgram(prog.id) : undefined}
          />
        ))}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" block={false} onClick={onAddProgram}>
            <PlusIcon />
            Add Existing Program
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {hoursRole === "registrar" && teachingTermExists && onRequestHoursAdjustment && (
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={hoursAdjustmentRequest?.status === "pending"}
                onClick={onRequestHoursAdjustment}
              >
                {hoursAdjustmentRequest?.status === "pending"
                  ? "Adjustment Pending"
                  : hoursAdjustmentRequest?.status === "rejected"
                    ? "Request Again (Rejected)"
                    : "Request Hours Adjustment"}
              </Button>
            )}
            {hoursRole === "dean" && hoursAdjustmentRequest?.status === "pending" && onReviewHoursAdjustment && (
              <Button
                type="button"
                variant="primary"
                block={false}
                onClick={onReviewHoursAdjustment}
              >
                Review Hours Request
              </Button>
            )}
            {onViewTeachingTerm && (
              <Button type="button" variant="outline" block={false} onClick={onViewTeachingTerm}>
                <EyeIcon />
                View Term
              </Button>
            )}
            <Button type="button" variant="outline" block={false} disabled={!hasChanges} onClick={onUpdateAssignment}>
              <EditIcon />
              Assign
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
