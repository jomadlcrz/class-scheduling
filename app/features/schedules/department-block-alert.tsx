import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { AlertIcon } from "~/components/ui/icons";
import type { TermDepartmentBlockReason, TermDepartmentEntry } from "~/types/term-scheduling";

const BLOCK_REASON_LABELS: Record<TermDepartmentBlockReason, string> = {
  no_finalized_majors: "No finalized majors",
  no_sets: "No active sets",
  schedules_incomplete: "Schedules incomplete",
  nothing_to_send: "Nothing to send",
  majors_still_open: "Majors still open",
};

const SET_STATUS_LABELS: Record<TermDepartmentEntry["programs"][number]["sets"][number]["status"], string> = {
  ready: "Ready",
  incomplete: "Incomplete",
  unscheduled: "Unscheduled",
};

const RELEASE_STATUS_TONES: Record<string, "slate" | "gold" | "emerald" | "red" | "sky"> = {
  draft: "slate",
  rejected: "red",
  pending_dean_review: "gold",
  approved: "emerald",
};

type DepartmentBlockAlertProps = {
  message: string;
  reason: string;
  department: TermDepartmentEntry;
};

/** Expanded feedback for a blocked program/department send, driven by the backend's `department` payload. */
export function DepartmentBlockAlert({ message, reason, department }: DepartmentBlockAlertProps) {
  const reasonLabel = BLOCK_REASON_LABELS[reason as TermDepartmentBlockReason] ?? reason;

  const blockers = department.programs
    .flatMap((program) =>
      program.sets
        .filter((set) => set.status !== "ready")
        .map((set) => ({ program: program.programAbbrev ?? program.programName ?? "—", set })),
    )
    .slice(0, 12);

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertIcon />
      <AlertTitle>{message}</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              {department.departmentName} ({department.departmentAbbrev})
            </span>
            <Badge tone="navy">{department.totalSets} sets</Badge>
            <Badge tone="emerald">{department.readyCount} ready</Badge>
            <Badge tone="gold">{department.sendableCount} sendable</Badge>
            <Badge tone="red">{reasonLabel}</Badge>
          </div>
          {blockers.length > 0 && (
            <ul className="divide-y divide-red-100 dark:divide-red-400/10">
              {blockers.map(({ program, set }) => {
                const setLabel = set.setCode ?? set.setName ?? `Set ${set.setId}`;
                return (
                  <li key={`${program}-${set.setId}`} className="flex flex-wrap items-center gap-2 py-1.5 text-xs">
                    <span className="font-semibold">{program}</span>
                    <span>{setLabel}</span>
                    {set.yearLevel != null && <span className="text-slate-500">YR {set.yearLevel}</span>}
                    <Badge tone="red">{SET_STATUS_LABELS[set.status]}</Badge>
                    {set.releaseStatus && (
                      <Badge tone={RELEASE_STATUS_TONES[set.releaseStatus] ?? "slate"}>
                        {set.releaseStatus}
                      </Badge>
                    )}
                  </li>
                );
              })}
              {blockers.length >= 12 && <li className="py-1.5 text-xs opacity-80">…and more.</li>}
            </ul>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}