import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { DatePicker } from "~/components/ui/date-picker";
import { FieldChrome, Input } from "~/components/ui/input";
import { ConfirmDialog, Modal, ModalActions } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { ApiError } from "~/lib/api";
import { InfoCircleIcon } from "~/components/ui/icons";
import { Tooltip } from "~/components/ui/tooltip";
import { EditRequestAttemptMeter } from "~/features/schedules/edit-request-attempt-meter";
import { termPhaseService } from "~/services/term-phase.service";
import type {
  DepartmentReadinessResponse,
  MajorEditRequestAttemptSummary,
  MajorSchedulingExtension,
  SchedulingWindowName,
  SchedulingWindowsSnapshot,
  TermDistributionReadiness,
  TermPhaseResponse,
  TermResolutionRun,
  TermResponseReadiness,
} from "~/types/term-phase";

function toLocalDatetimeInput(isoString: string | null): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

function datePart(value: string): string {
  return value.slice(0, 10);
}

function timePart(value: string): string {
  return value.slice(11, 16);
}

function mergeLocalDateTime(date: string, time: string): string {
  return date ? `${date}T${time || "00:00"}` : "";
}

function DateTimePicker({
  id,
  label,
  value,
  onChange,
  disabled = false,
  keepPopoverBelow = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  keepPopoverBelow?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
      <DatePicker
        id={`${id}-date`}
        label={label}
        value={datePart(value)}
        disabled={disabled}
        keepPopoverBelow={keepPopoverBelow}
        onChange={(date) => onChange(mergeLocalDateTime(date, timePart(value)))}
      />
      <Input
        id={`${id}-time`}
        label="Time"
        type="time"
        value={timePart(value)}
        disabled={disabled}
        onChange={(event) => onChange(mergeLocalDateTime(datePart(value), event.target.value))}
      />
    </div>
  );
}

function formatCountdown(targetIso: string | null, serverTimeIso: string | null): string {
  if (!targetIso || !serverTimeIso) return "";
  const target = new Date(targetIso).getTime();
  const server = new Date(serverTimeIso).getTime();
  const diffMs = target - server;

  if (diffMs <= 0) {
    const pastSec = Math.floor(Math.abs(diffMs) / 1000);
    const pastDays = Math.floor(pastSec / 86400);
    if (pastDays > 1) return `${pastDays} days ago`;
    if (pastDays === 1) return "1 day ago";
    return "passed";
  }

  const diffSec = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  if (days > 1) return `in ${days} days`;
  if (days === 1) return "in 1 day";
  if (hours > 1) return `in ${hours} hours`;
  return "in less than an hour";
}

const PHASE_GUIDANCE: Record<TermPhaseResponse["phase"], { title: string; description: string }> = {
  major_scheduling: {
    title: "Dean major schedules are being prepared",
    description: "Keep Major Scheduling open until every department has submitted the major meetings that constrain generation.",
  },
  generation: {
    title: "Build complete section timetables",
    description: "Generate and save every section. Distribution sends complete department schedules to their Deans for the first review stage.",
  },
  suggestion_window: {
    title: "Instructor shift requests are open",
    description: "Instructors can accept or propose changes. When the window closes, run the term-wide resolution pass.",
  },
  resolution: {
    title: "Resolve requests and collect final approvals",
    description: "Review resolution outcomes, return resolved schedules for final Dean approval, then publish only after every required approval is complete.",
  },
  finalized: {
    title: "Term published",
    description: "Approved schedules are now visible to students and instructors. Further changes must use the controlled reopen/edit workflow.",
  },
};

const TERM_WORKFLOW_STEPS = [
  { key: "major", label: "Major Scheduling" },
  { key: "distribution", label: "Distribution" },
  { key: "shift", label: "Shift Request" },
  { key: "resolution", label: "Resolution" },
  { key: "finalized", label: "Finalized" },
] as const;

const TERM_CALENDAR_PANELS = [
  { key: "overview", label: "Overview", description: "Term stage and next action" },
  { key: "calendar", label: "Calendar", description: "Windows, deadlines, and extensions" },
  { key: "readiness", label: "Dean review", description: "Readiness and distribution" },
  { key: "resolution", label: "Resolution", description: "Requests and publication" },
] as const;

type TermCalendarPanel = (typeof TERM_CALENDAR_PANELS)[number]["key"];

export function TermCalendarPage() {
  const { schoolYears, defaultSchoolYear, loading: termsLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState("");
  const [activePanel, setActivePanel] = useState<TermCalendarPanel>("overview");

  const [phaseData, setPhaseData] = useState<TermPhaseResponse | null>(null);
  const [readiness, setReadiness] = useState<TermDistributionReadiness | null>(null);
  const [deptReadiness, setDeptReadiness] = useState<DepartmentReadinessResponse | null>(null);
  const [majorExtensions, setMajorExtensions] = useState<MajorSchedulingExtension[]>([]);
  const [resolution, setResolution] = useState<TermResolutionRun | null>(null);
  const [schedulingWindows, setSchedulingWindows] = useState<SchedulingWindowsSnapshot | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deadlines Form State
  const [majorsDueAtInput, setMajorsDueAtInput] = useState("");
  const [suggestionsDueAtInput, setSuggestionsDueAtInput] = useState("");
  const [savingDeadlines, setSavingDeadlines] = useState(false);

  // Policy Limits State
  const [majorEditRequestAttempts, setMajorEditRequestAttempts] = useState<MajorEditRequestAttemptSummary | null>(null);
  const [majorEditLimitDraft, setMajorEditLimitDraft] = useState("2");
  const [savingMajorEditLimit, setSavingMajorEditLimit] = useState(false);
  const [suggestionLimitDraft, setSuggestionLimitDraft] = useState("1");
  const [savingSuggestionLimit, setSavingSuggestionLimit] = useState(false);
  const [responseReadiness, setResponseReadiness] = useState<TermResponseReadiness | null>(null);

  // Modals State
  const [reopenMajorsModalOpen, setReopenMajorsModalOpen] = useState(false);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [discardGenerated, setDiscardGenerated] = useState(false);
  const [sendProgramTarget, setSendProgramTarget] = useState<{ programId: number; programAbbrev: string } | null>(null);
  const [sendProgramNote, setSendProgramNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [windowTarget, setWindowTarget] = useState<SchedulingWindowName | null>(null);
  const [windowClosingAt, setWindowClosingAt] = useState("");
  const [windowConfirmation, setWindowConfirmation] = useState<{ title: string; body: string; confirmLabel: string } | null>(null);
  const [extensionDepartmentId, setExtensionDepartmentId] = useState("");
  const [extensionUntil, setExtensionUntil] = useState("");
  const [extensionReason, setExtensionReason] = useState("");

  // Initial selection: ask the backend which term is running
  useEffect(() => {
    if (selectedSchoolYearId && selectedSemesterNumber) return;
    let cancelled = false;

    termPhaseService
      .getCurrentTermPhase()
      .then((res) => {
        if (cancelled) return;
        if (res.syId && res.semesterNumber) {
          if (!selectedSchoolYearId) setSelectedSchoolYearId(String(res.syId));
          if (!selectedSemesterNumber) setSelectedSemesterNumber(String(res.semesterNumber));
        } else {
          // Fallback to local selector defaults
          if (!selectedSchoolYearId && schoolYears.length > 0) {
            const match = schoolYears.find((s) => s.schoolYear === defaultSchoolYear) ?? schoolYears[0];
            if (match) setSelectedSchoolYearId(String(match.id));
          }
          if (!selectedSemesterNumber && semesters.length > 0) {
            const first = semesters.find((s) => s.semesterNumber !== 3) ?? semesters[0];
            if (first) setSelectedSemesterNumber(String(first.semesterNumber));
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (!selectedSchoolYearId && schoolYears.length > 0) {
          const match = schoolYears.find((s) => s.schoolYear === defaultSchoolYear) ?? schoolYears[0];
          if (match) setSelectedSchoolYearId(String(match.id));
        }
        if (!selectedSemesterNumber && semesters.length > 0) {
          const first = semesters.find((s) => s.semesterNumber !== 3) ?? semesters[0];
          if (first) setSelectedSemesterNumber(String(first.semesterNumber));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [schoolYears, defaultSchoolYear, semesters, selectedSchoolYearId, selectedSemesterNumber]);

  const syId = selectedSchoolYearId ? Number(selectedSchoolYearId) : null;
  const semesterNumber = selectedSemesterNumber ? Number(selectedSemesterNumber) : null;

  const loadData = useCallback(async () => {
    if (!syId || !semesterNumber) return;
    setLoading(true);
    setError(null);
    try {
      const [phaseRes, readyRes, deptRes, resRun, windowsRes, extensionsRes, editAttemptsRes, respReadinessRes] = await Promise.all([
        termPhaseService.getTermPhase(syId, semesterNumber),
        termPhaseService.getDistributionReadiness(syId, semesterNumber).catch(() => null),
        termPhaseService.getDepartmentReadiness(syId, semesterNumber).catch(() => null),
        termPhaseService.getResolution(syId, semesterNumber).catch(() => null),
        termPhaseService.getSchedulingWindows(syId, semesterNumber).catch(() => null),
        termPhaseService.getMajorExtensions(syId, semesterNumber).catch(() => []),
        termPhaseService.getMajorEditRequestAttempts(syId, semesterNumber).catch(() => null),
        termPhaseService.getResponseReadiness(syId, semesterNumber).catch(() => null),
      ]);
      setPhaseData(phaseRes);
      setReadiness(readyRes);
      setDeptReadiness(deptRes);
      setResolution(resRun);
      setSchedulingWindows(windowsRes ?? phaseRes.schedulingWindows ?? null);
      setMajorExtensions(extensionsRes);
      setMajorEditRequestAttempts(editAttemptsRes);
      setResponseReadiness(respReadinessRes);
      setMajorsDueAtInput(toLocalDatetimeInput(phaseRes.majorsDueAt));
      setSuggestionsDueAtInput(toLocalDatetimeInput(phaseRes.suggestionsDueAt));
      if (phaseRes.majorEditRequestLimit != null) {
        setMajorEditLimitDraft(String(phaseRes.majorEditRequestLimit));
      }
      if (phaseRes.suggestionAttemptLimit != null) {
        setSuggestionLimitDraft(String(phaseRes.suggestionAttemptLimit));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load term scheduling calendar.");
    } finally {
      setLoading(false);
    }
  }, [syId, semesterNumber]);

  async function handleSaveMajorEditLimit() {
    if (!syId || !semesterNumber) return;
    const limit = Number(majorEditLimitDraft);
    if (!Number.isInteger(limit) || limit < 1 || limit > 999) {
      toast.error("Enter a whole number from 1 to 999.");
      return;
    }
    setSavingMajorEditLimit(true);
    try {
      const res = await termPhaseService.setMajorEditRequestPolicy(syId, semesterNumber, limit);
      toast.success(res.message || "Institution-wide Major edit-request limit updated.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update Major edit-request limit.");
    } finally {
      setSavingMajorEditLimit(false);
    }
  }

  async function handleSaveSuggestionLimit() {
    if (!syId || !semesterNumber) return;
    const limit = Number(suggestionLimitDraft);
    if (!Number.isInteger(limit) || limit < 1 || limit > 999) {
      toast.error("Enter a whole number from 1 to 999.");
      return;
    }
    setSavingSuggestionLimit(true);
    try {
      const res = await termPhaseService.setSuggestionPolicy(syId, semesterNumber, limit);
      toast.success(res.message || "Instructor suggestion limit updated.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update suggestion limit.");
    } finally {
      setSavingSuggestionLimit(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveDeadlines(forceReopen = false) {
    if (!syId || !semesterNumber || !phaseData) return;

    // Check if extending a lapsed majors deadline
    const majorsDateObj = majorsDueAtInput ? new Date(majorsDueAtInput) : null;
    const currentMajorsPassed = phaseData.majorsDeadlinePassed;
    const isExtendingMajors =
      currentMajorsPassed && majorsDateObj && majorsDateObj.getTime() > new Date(phaseData.serverTime).getTime();

    if (isExtendingMajors && !forceReopen) {
      setReopenMajorsModalOpen(true);
      return;
    }

    setSavingDeadlines(true);
    try {
      const payload = {
        majorsDueAt: majorsDueAtInput ? new Date(majorsDueAtInput).toISOString() : null,
        suggestionsDueAt: suggestionsDueAtInput ? new Date(suggestionsDueAtInput).toISOString() : null,
        discardGenerated: forceReopen ? discardGenerated : false,
      };
      const res = await termPhaseService.setDeadlines(syId, semesterNumber, payload);
      toast.success(res.message || "Deadlines updated.");
      setReopenMajorsModalOpen(false);
      setDiscardGenerated(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update deadlines.");
    } finally {
      setSavingDeadlines(false);
    }
  }

  async function handleAdvancePhase(action: "close_majors" | "distribute" | "resolve" | "forward_for_approval" | "finalize"): Promise<boolean> {
    if (!syId || !semesterNumber) return false;
    setActionLoading(true);
    try {
      const res = await termPhaseService.advancePhase(syId, semesterNumber, action);
      toast.success(res.message || "Term phase advanced successfully.");
      await loadData();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to advance phase.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRewindPhase() {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      const res = await termPhaseService.rewindPhase(syId, semesterNumber);
      toast.success(res.message || "Phase rewound successfully.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rewind phase.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleOpenPhase(phase: string) {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      const res = await termPhaseService.openPhase(syId, semesterNumber, phase);
      toast.success(res.message || `Reopened ${phase}.`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reopen phase.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePreviewResolution() {
    if (!syId || !semesterNumber) return;
    setPreviewLoading(true);
    try {
      const res = await termPhaseService.previewResolution(syId, semesterNumber);
      toast.success(res.message);
      setResolution(res.resolution);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to preview suggestion resolution.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function openWindowDialog(window: SchedulingWindowName) {
    setWindowTarget(window);
    setWindowClosingAt("");
  }

  async function handleOpenWindow(confirmed = false) {
    if (!syId || !semesterNumber || !windowTarget || !windowClosingAt) return;
    setActionLoading(true);
    try {
      const result = await termPhaseService.openSchedulingWindow(
        syId, semesterNumber, windowTarget, new Date(windowClosingAt).toISOString(), confirmed,
      );
      toast.success(result.message);
      setWindowTarget(null);
      await loadData();
    } catch (err) {
      const details = err instanceof ApiError ? err.details : null;
      const extra = details?.extra && typeof details.extra === "object" ? details.extra as Record<string, unknown> : details;
      const confirmation = extra?.confirmation;
      if (confirmation && typeof confirmation === "object") {
        const challenge = confirmation as Record<string, unknown>;
        if (
          typeof challenge.title === "string" &&
          typeof challenge.body === "string" &&
          typeof challenge.confirmLabel === "string"
        ) {
          setWindowConfirmation({
            title: challenge.title,
            body: challenge.body,
            confirmLabel: challenge.confirmLabel,
          });
          return;
        }
      }
      toast.error(err instanceof Error ? err.message : "Unable to open the scheduling window.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCloseWindow(window: SchedulingWindowName) {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      const result = await termPhaseService.closeSchedulingWindow(syId, semesterNumber, window);
      toast.success(result.message);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to close the scheduling window.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendProgram() {
    if (!syId || !semesterNumber || !sendProgramTarget) return;
    setActionLoading(true);
    try {
      const res = await termPhaseService.sendProgram(
        syId,
        semesterNumber,
        sendProgramTarget.programId,
        sendProgramNote,
      );
      toast.success(res.message);
      setSendProgramTarget(null);
      setSendProgramNote("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send program schedules.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdrawProgram(programId: number) {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      const res = await termPhaseService.withdrawProgram(syId, semesterNumber, programId);
      toast.success(res.message);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to withdraw program.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendDepartment(departmentId: number) {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      const res = await termPhaseService.sendDepartment(syId, semesterNumber, departmentId);
      toast.success(res.message);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send department schedules.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGrantMajorExtension() {
    if (!syId || !semesterNumber || !extensionDepartmentId || !extensionUntil) return;
    setActionLoading(true);
    try {
      const result = await termPhaseService.grantMajorExtension(syId, semesterNumber, {
        departmentId: Number(extensionDepartmentId),
        extendedUntil: new Date(extensionUntil).toISOString(),
        ...(extensionReason.trim() ? { reason: extensionReason.trim() } : {}),
      });
      toast.success(result.message);
      setExtensionDepartmentId("");
      setExtensionUntil("");
      setExtensionReason("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to grant the extension.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevokeMajorExtension(extensionId: number) {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      const result = await termPhaseService.revokeMajorExtension(syId, semesterNumber, extensionId);
      toast.success(result.message);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to revoke the extension.");
    } finally {
      setActionLoading(false);
    }
  }

  // The backend supplies the authoritative lifecycle and detail stage. Timestamps
  // remain useful for history but must not decide which action is currently legal.
  const termDistributed = Boolean(phaseData?.distributedAt);
  const termResolved = Boolean(phaseData?.resolvedAt);
  const termFinalized = Boolean(phaseData?.finalizedAt);
  const releaseStatuses = deptReadiness?.departments.flatMap((department) =>
    department.programs.flatMap((program) => program.sets.map((set) => set.releaseStatus)),
  ) ?? [];
  const awaitingInitialDeanReview = releaseStatuses.filter(
    (status) => status === "draft" || status === "rejected" || status === "pending_dean_review",
  ).length;
  const awaitingFinalDeanApproval = releaseStatuses.filter(
    (status) => status === "pending_final_approval",
  ).length;
  const allSetsApproved = releaseStatuses.length > 0 && releaseStatuses.every((status) => status === "approved");
  const detailStage = phaseData?.detailStage;
  const workflowTitle = detailStage
    ? detailStage.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : phaseData?.phaseLabel ?? "Scheduling";
  const workflowDescription = detailStage === "ready_for_suggestions"
    ? "Every required schedule has reached instructor review. Start the Shift Request window when ready."
    : detailStage === "final_approval"
      ? "Resolved schedules are waiting for final Dean approval."
      : detailStage === "ready_for_publication"
        ? "Every required release is approved. The Registrar can now finalize and publish the term."
        : detailStage === "finalized"
          ? "The Registrar finalized the approved term. Schedules are published to students and instructors."
          : phaseData
            ? PHASE_GUIDANCE[phaseData.phase].description
            : "";

  const unscheduledList = readiness?.unscheduled ?? [];
  const incompleteList = readiness?.incomplete ?? [];
  const resolutionOutcomes = resolution?.outcome ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 font-body">
      <PageHeader title="Term Scheduling Calendar" />

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-4 bg-slate-50/70 px-4 py-4 dark:bg-white/2.5 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Term context</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Deadlines, releases, and approval progress for the selected academic term.
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <FieldChrome id="term-calendar-sy" label="School Year">
              <Select
                value={selectedSchoolYearId}
                onValueChange={(value) => setSelectedSchoolYearId(value ?? "")}
                disabled={termsLoading || loading}
                items={schoolYears.map((s) => ({ value: String(s.id), label: s.schoolYear }))}
              >
                <SelectTrigger id="term-calendar-sy">
                  <SelectValue placeholder="Select school year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.schoolYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>

            <FieldChrome id="term-calendar-sem" label="Semester">
              <Select
                value={selectedSemesterNumber}
                onValueChange={(value) => setSelectedSemesterNumber(value ?? "")}
                disabled={semestersLoading || loading}
                items={semesters
                  .filter((s) => s.semesterNumber !== 3)
                  .map((s) => ({
                    value: String(s.semesterNumber),
                    label: semesterLabel(s.semesterNumber),
                  }))}
              >
                <SelectTrigger id="term-calendar-sem">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters
                    .filter((s) => s.semesterNumber !== 3)
                    .map((s) => (
                      <SelectItem key={s.id} value={String(s.semesterNumber)}>
                        {semesterLabel(s.semesterNumber)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </div>
        </div>
      </Card>

      {/* Body Content */}
      {loading && !phaseData ? (
        <div className="mt-8 flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button type="button" variant="outline" className="mt-4" block={false} onClick={loadData}>
            Retry
          </Button>
        </div>
      ) : phaseData ? (
        <div className="mt-8 space-y-6">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5 dark:border-white/10 dark:bg-white/2.5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registrar workspace</p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">Focus on one responsibility at a time.</p>
              </div>
              <Badge tone={detailStage === "finalized" ? "emerald" : "sky"}>{workflowTitle}</Badge>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 dark:divide-white/10 lg:grid-cols-4 lg:divide-y-0">
              {TERM_CALENDAR_PANELS.map((panel, index) => {
                const selected = panel.key === activePanel;
                return (
                  <button
                    key={panel.key}
                    type="button"
                    onClick={() => setActivePanel(panel.key)}
                    className={`relative min-w-0 px-4 py-4 text-left transition-colors sm:px-5 ${
                      selected
                        ? "bg-sky-50/70 text-navy-800 dark:bg-sky-950/25 dark:text-mist-100"
                        : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-navy-900 dark:text-slate-300 dark:hover:bg-white/3"
                    }`}
                  >
                    {selected && <span className="absolute inset-x-0 top-0 h-0.5 bg-gold-400" />}
                    <span className={`text-xs font-semibold ${selected ? "text-sky-600 dark:text-sky-300" : "text-slate-400"}`}>
                      0{index + 1}
                    </span>
                    <span className="mt-1 block text-sm font-semibold tracking-tight">{panel.label}</span>
                    <span className="mt-0.5 block text-xs leading-4 text-slate-500 dark:text-slate-400">{panel.description}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Card 1: Phase Progress Overview */}
          <Card className={activePanel === "overview" ? "overflow-hidden" : "hidden"}>
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5 dark:border-white/10 dark:bg-white/2.5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current responsibility</span>
                <h2 className="mt-1 font-display text-2xl tracking-wide text-navy-800 dark:text-mist-100">{workflowTitle}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {workflowDescription}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge tone={phaseData.governed ? "navy" : "slate"}>{phaseData.governed ? "Governed" : "Ungoverned"}</Badge>
                <Badge tone={phaseData.gates.majorsOpen ? "emerald" : "slate"}>Majors {phaseData.gates.majorsOpen ? "open" : "closed"}</Badge>
                <Badge tone={phaseData.gates.suggestionsOpen ? "violet" : "slate"}>Requests {phaseData.gates.suggestionsOpen ? "open" : "closed"}</Badge>
              </div>
              </div>
            </div>

            {/* Only Major Scheduling and Shift Request are persisted phases; the other cards are action milestones. */}
            <div className="grid grid-cols-1 divide-y divide-slate-200 dark:divide-white/10 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
              {TERM_WORKFLOW_STEPS.map((step, idx) => {
                const stepPhase = step.key === "major" ? "major_scheduling" : step.key === "distribution" ? "generation" : step.key === "shift" ? "suggestion_window" : step.key === "resolution" ? "resolution" : "finalized";
                const isPast = step.key === "major" ? phaseData.phase !== "major_scheduling" : step.key === "distribution" ? termDistributed : step.key === "shift" ? termResolved : step.key === "resolution" ? termResolved : termFinalized;
                const isCurrent = termFinalized
                  ? step.key === "finalized"
                  : (step.key === "major" && phaseData.phase === "major_scheduling") ||
                    (step.key === "distribution" && phaseData.phase === "suggestion_window" && !termDistributed) ||
                    (step.key === "shift" && termDistributed && !termResolved) ||
                    (step.key === "resolution" && termResolved);
                const deadlineField = step.key === "major" ? phaseData.majorsDueAt : step.key === "shift" ? phaseData.suggestionsDueAt : null;

                return (
                  <div
                    key={stepPhase}
                    className={`flex min-h-28 flex-col justify-between px-4 py-4 transition-colors ${
                      isCurrent
                        ? "bg-sky-50/70 shadow-[inset_0_3px_0_0_#eab308] dark:bg-sky-950/20"
                        : isPast
                          ? "bg-slate-50/70 text-slate-400 dark:bg-white/2 dark:text-slate-500"
                          : "bg-white dark:bg-navy-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isCurrent ? "text-sky-600 dark:text-sky-300" : "text-slate-400"}`}>
                          0{idx + 1}
                        </span>
                        {isCurrent && (
                          <span title="Open for work" className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <span
                        className={`mt-2 block text-xs font-semibold ${
                          isCurrent
                            ? "text-sky-900 dark:text-sky-200"
                            : isPast
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-navy-700 dark:text-mist-100"
                        }`}
                      >
                        {step.label}
                      </span>

                      {deadlineField && (
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                          Due: {new Date(deadlineField).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>

                    {step.key === "major" && isPast && !termDistributed && phaseData.gates.majorReopenAllowed && (
                      <button
                        type="button"
                        className="mt-2 text-left text-[11px] font-medium text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400"
                        disabled={actionLoading}
                        onClick={() => handleOpenPhase(stepPhase)}
                      >
                        Reopen Phase →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lifecycle Timestamps */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-6">
              {phaseData.distributedAt && (
                <span>
                  Distributed: {new Date(phaseData.distributedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {phaseData.resolvedAt && (
                <span>
                  Resolved: {new Date(phaseData.resolvedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {phaseData.finalizedAt && (
                <span>
                  Finalized: {new Date(phaseData.finalizedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </Card>

          {/* The backend is authoritative about whether a window accepts work. */}
          <div className={activePanel === "calendar" ? "grid gap-6 xl:grid-cols-2 xl:items-start" : "hidden"}>
          {schedulingWindows && (
            <Card className="p-5 sm:p-6">
              <div className="border-b border-slate-100 pb-3 dark:border-white/5">
                <h2 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">Scheduling Windows</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Only one window can be open at a time. Opening the other closes the active window.</p>
              </div>
              <div className="mt-4 grid gap-3">
                {(["major", "suggestion"] as const).map((name) => {
                  const window = schedulingWindows.windows[name];
                  return <div key={name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
                    <div>
                      <div className="flex items-center gap-2"><span className="font-semibold text-navy-800 dark:text-mist-100">{window.label}</span><Badge tone={window.isOpen ? "emerald" : "slate"}>{window.isOpen ? "Open" : "Closed"}</Badge></div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{window.isOpen ? `Closes ${new Date(window.scheduledClosingAt!).toLocaleString()}` : window.closedAt ? `Closed ${new Date(window.closedAt).toLocaleString()}` : "Not opened for this term."}</p>
                      {name === "suggestion" && responseReadiness && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {responseReadiness.respondedCount ?? 0} of {responseReadiness.expected ?? 0} instructor(s) responded
                          {(responseReadiness.silentCount ?? 0) > 0 ? ` (${responseReadiness.silentCount} silent)` : ""}.
                          {responseReadiness.canCloseEarly && (
                            <span className="ml-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                              ✓ All responded (ready to close early).
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div>{window.isOpen ? <Button type="button" variant="outline" block={false} disabled={actionLoading} onClick={() => void handleCloseWindow(name)}>Close now</Button> : <Button type="button" block={false} disabled={actionLoading || (name === "major" && !phaseData.gates.majorReopenAllowed)} onClick={() => openWindowDialog(name)}>Open window</Button>}</div>
                  </div>;
                })}
              </div>
            </Card>
          )}

          <Card className="p-5 sm:p-6 xl:col-span-2">
            <div className="border-b border-slate-100 pb-3 dark:border-white/5">
              <h2 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">Major Scheduling Extensions</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Give one department more time without reopening Major Scheduling for every department. Shift Requests cannot be extended this way.
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldChrome id="extension-department" label="Department">
                <Select
                  value={extensionDepartmentId}
                  onValueChange={(value) => setExtensionDepartmentId(value ?? "")}
                  disabled={actionLoading || !phaseData.gates.majorReopenAllowed || (deptReadiness?.departments.length ?? 0) === 0}
                  items={(deptReadiness?.departments ?? []).map((department) => ({
                    value: String(department.departmentId),
                    label: `${department.departmentName} (${department.departmentAbbrev})`,
                  }))}
                >
                  <SelectTrigger id="extension-department"><SelectValue placeholder="Select a department" /></SelectTrigger>
                  <SelectContent>
                    {(deptReadiness?.departments ?? []).map((department) => (
                      <SelectItem key={department.departmentId} value={String(department.departmentId)}>
                        {department.departmentName} ({department.departmentAbbrev})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldChrome>
              <DateTimePicker
                id="extension-until"
                label="Extended until"
                value={extensionUntil}
                onChange={setExtensionUntil}
                disabled={!phaseData.gates.majorReopenAllowed}
              />
              <Textarea id="extension-reason" label="Reason (optional)" value={extensionReason} onChange={(event) => setExtensionReason(event.target.value)} disabled={!phaseData.gates.majorReopenAllowed} />
            </div>
            {(deptReadiness?.departments.length ?? 0) === 0 && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Department readiness is unavailable, so an extension cannot be granted yet.</p>
            )}
            {!phaseData.gates.majorReopenAllowed && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Shift Request has started for this term, so Major Scheduling extensions are permanently unavailable.</p>
            )}
            <div className="mt-4 flex justify-end">
              <Button type="button" block={false} isLoading={actionLoading} disabled={!phaseData.gates.majorReopenAllowed || !extensionDepartmentId || !extensionUntil} onClick={handleGrantMajorExtension}>
                Grant Extension
              </Button>
            </div>

            {majorExtensions.length > 0 && (
              <div className="mt-5 overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableHeader>Department</TableHeader>
                    <TableHeader>Extended until</TableHeader>
                    <TableHeader>Reason</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader><span className="sr-only">Actions</span></TableHeader>
                  </TableHead>
                  <TableBody>
                    {majorExtensions.map((extension) => {
                      const department = deptReadiness?.departments.find((item) => item.departmentId === extension.departmentId);
                      return (
                        <TableRow key={extension.id}>
                          <TableCell>{department ? `${department.departmentName} (${department.departmentAbbrev})` : `Department #${extension.departmentId}`}</TableCell>
                          <TableCell>{new Date(extension.extendedUntil).toLocaleString()}</TableCell>
                          <TableCell>{extension.reason ?? "—"}</TableCell>
                          <TableCell><Badge tone={extension.active ? "emerald" : "slate"}>{extension.active ? "Active" : extension.revokedAt ? "Revoked" : "Lapsed"}</Badge></TableCell>
                          <TableCell>
                            {extension.active && <Button type="button" variant="outline" block={false} disabled={actionLoading} onClick={() => handleRevokeMajorExtension(extension.id)}>Revoke</Button>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          {/* Card 2: Deadlines Form */}
          <Card className={activePanel === "calendar" ? "p-5 sm:p-6 xl:col-span-2" : "hidden"}>
            <div className="border-b border-slate-100 pb-3 dark:border-white/5">
              <h2 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">Deadlines Control</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                The college calendar owns two deadlines for external stakeholders (Deans and Instructors). Extending a lapsed deadline reopens that phase for all departments.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <DateTimePicker
                  id="majors-due"
                  label="1. Major Scheduling Deadline (Deans)"
                  value={majorsDueAtInput}
                  onChange={setMajorsDueAtInput}
                />
                {phaseData.majorsDueAt && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Currently: {new Date(phaseData.majorsDueAt).toLocaleString()} ({formatCountdown(phaseData.majorsDueAt, phaseData.serverTime)})
                    {phaseData.majorsDeadlinePassed && (
                      <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                        ⚠ Lapsed. Later date reopens it.
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <DateTimePicker
                  id="suggestions-due"
                  label="2. Suggestions Window Deadline (Instructors)"
                  value={suggestionsDueAtInput}
                  onChange={setSuggestionsDueAtInput}
                />
                {phaseData.suggestionsDueAt && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Currently: {new Date(phaseData.suggestionsDueAt).toLocaleString()} ({formatCountdown(phaseData.suggestionsDueAt, phaseData.serverTime)})
                    {phaseData.suggestionsDeadlinePassed && (
                      <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                        ⚠ Lapsed. Later date reopens it.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                block={false}
                onClick={() => {
                  setMajorsDueAtInput(toLocalDatetimeInput(phaseData.majorsDueAt));
                  setSuggestionsDueAtInput(toLocalDatetimeInput(phaseData.suggestionsDueAt));
                }}
              >
                Reset
              </Button>
              <Button
                type="button"
                block={false}
                isLoading={savingDeadlines}
                loadingLabel="Saving…"
                onClick={() => handleSaveDeadlines(false)}
              >
                Save Deadlines
              </Button>
            </div>
          </Card>

          {/* Card 3: Scheduling Policies & Limits */}
          <Card className={activePanel === "calendar" ? "p-5 sm:p-6 xl:col-span-2 space-y-6" : "hidden"}>
            <div className="border-b border-slate-100 pb-3 dark:border-white/5">
              <h2 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
                Scheduling Policies &amp; Attempt Limits
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Institution-wide policy limits enforce how many revisions Deans and Instructors can request per term.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Institution-wide Major edit-request limit */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                        Major Schedule edit-request limit
                      </h3>
                      <Tooltip
                        wrap
                        direction="top"
                        label="Rules: The configured limit gives every Dean the same maximum number of Major Scheduling edit requests for the term. Each successfully submitted request uses one attempt whether it is approved or rejected. The limit can be changed only while Major Scheduling is open."
                      >
                        <button
                          type="button"
                          aria-label="Major Scheduling edit-request limit rules"
                          className="cursor-help text-slate-400 transition-colors hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:text-mist-100"
                        >
                          <InfoCircleIcon size={16} />
                        </button>
                      </Tooltip>
                    </div>
                    <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                      One limit applies equally to every Dean during Major scheduling edit requests.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="major-edit-request-limit"
                      type="number"
                      min={1}
                      max={999}
                      step={1}
                      value={majorEditLimitDraft}
                      onChange={(event) => setMajorEditLimitDraft(event.target.value)}
                      className="h-9 w-20 rounded-lg border border-slate-300 bg-white px-3 text-center font-body text-sm font-semibold tabular-nums text-navy-800 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-white/15 dark:bg-surface-raised dark:text-mist-100"
                    />
                    <Button
                      type="button"
                      block={false}
                      isLoading={savingMajorEditLimit}
                      loadingLabel="Saving"
                      disabled={savingMajorEditLimit || majorEditLimitDraft === String(phaseData.majorEditRequestLimit ?? 2)}
                      onClick={handleSaveMajorEditLimit}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <EditRequestAttemptMeter
                    attemptsUsed={0}
                    attemptLimit={Number(majorEditLimitDraft) || phaseData.majorEditRequestLimit || 2}
                    limitOnly
                  />
                </div>
              </div>

              {/* Instructor suggestion limit */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                        Instructor suggestion attempt limit
                      </h3>
                      <Tooltip
                        wrap
                        direction="top"
                        label="Rules: The configured limit gives every instructor the same maximum number of suggestions for the term. Only a successfully submitted and validated suggestion uses one attempt; accepting a schedule does not."
                      >
                        <button
                          type="button"
                          aria-label="Shift Request suggestion-limit rules"
                          className="cursor-help text-slate-400 transition-colors hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:text-mist-100"
                        >
                          <InfoCircleIcon size={16} />
                        </button>
                      </Tooltip>
                    </div>
                    <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                      One limit applies equally to every instructor during Shift Request.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="suggestion-attempt-limit"
                      type="number"
                      min={1}
                      max={999}
                      step={1}
                      value={suggestionLimitDraft}
                      onChange={(event) => setSuggestionLimitDraft(event.target.value)}
                      className="h-9 w-20 rounded-lg border border-slate-300 bg-white px-3 text-center font-body text-sm font-semibold tabular-nums text-navy-800 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-white/15 dark:bg-surface-raised dark:text-mist-100"
                    />
                    <Button
                      type="button"
                      block={false}
                      isLoading={savingSuggestionLimit}
                      loadingLabel="Saving"
                      disabled={savingSuggestionLimit || suggestionLimitDraft === String(phaseData.suggestionAttemptLimit ?? 1)}
                      onClick={handleSaveSuggestionLimit}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <EditRequestAttemptMeter
                    attemptsUsed={0}
                    attemptLimit={Number(suggestionLimitDraft) || phaseData.suggestionAttemptLimit || 1}
                    limitOnly
                    label="Suggestion attempt limit"
                  />
                </div>
              </div>
            </div>

            {/* Dean department edit-request attempts summary table */}
            {majorEditRequestAttempts && majorEditRequestAttempts.departments.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-white/5">
                <h3 className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Dean Edit-Request Usage by Department ({majorEditRequestAttempts.departments.length})
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {majorEditRequestAttempts.departments.map((dept) => (
                    <div
                      key={dept.departmentId}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-navy-800 dark:text-mist-100 text-xs">
                          {dept.departmentAbbrev}
                        </span>
                        <Badge tone={dept.canRequestEdit ? "emerald" : "gold"}>
                          {dept.submissionStatus}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 truncate" title={dept.departmentName}>
                        {dept.departmentName}
                      </p>
                      <div className="mt-2">
                        <EditRequestAttemptMeter
                          attemptsUsed={dept.attemptsUsed}
                          attemptLimit={majorEditRequestAttempts.attemptLimit}
                          showCount
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
          </div>

          {/* Card 4: Department Schedules & Readiness */}
          <Card className={activePanel === "readiness" ? "p-5 sm:p-6" : "hidden"}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
              <div>
                <h2 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">Department Schedules &amp; Distribution Readiness</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  All schedules for all departments must be complete before distributing the term. Finished departments can be sent ahead to their Deans.
                </p>
              </div>
              {readiness && <Badge tone={readiness.isReady ? "emerald" : "gold"}>{readiness.readyCount ?? 0} of {readiness.expected ?? 0} sets ready</Badge>}
            </div>

            {/* Unscheduled / Incomplete Sets Warning */}
            {readiness && !readiness.isReady && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
                {unscheduledList.length > 0 && (
                  <p className="mb-1">
                    <span className="font-semibold">No schedule yet ({unscheduledList.length}):</span>{" "}
                    {unscheduledList.map((s) => s.setName).join(", ")}
                  </p>
                )}
                {incompleteList.length > 0 && (
                  <p>
                    <span className="font-semibold">Incomplete schedules ({incompleteList.length}):</span>{" "}
                    {incompleteList.map((s) => s.setName).join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Department Breakdown */}
            <div className="mt-5 space-y-4">
              {(deptReadiness?.departments ?? []).map((dept) => {
                const allInDeanReview =
                  dept.totalSets > 0 &&
                  dept.programs.every((p) => p.sets.every((s) => s.releaseStatus === "pending_dean_review"));

                return (
                  <div
                    key={dept.departmentId}
                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 dark:border-white/10 dark:bg-white/2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-navy-800 dark:text-mist-100">
                          {dept.departmentName} ({dept.departmentAbbrev})
                        </span>
                        <Badge tone={dept.canSend ? "emerald" : "slate"}>
                          {dept.readyCount ?? 0} / {dept.totalSets ?? 0} sets
                        </Badge>
                        {allInDeanReview && (
                          <Badge tone="navy">
                            In Dean Review
                          </Badge>
                        )}
                      </div>

                      {phaseData.phase === "generation" && dept.canSend && !allInDeanReview && (
                        <Button
                          type="button"
                          variant="outline"
                          block={false}
                          disabled={actionLoading}
                          onClick={() => handleSendDepartment(dept.departmentId)}
                        >
                          Send Department to Dean
                        </Button>
                      )}
                    </div>

                    {/* Programs List */}
                    <div className="mt-3 divide-y divide-slate-200/60 dark:divide-white/5">
                      {(dept.programs ?? []).map((prog) => {
                        const progSets = prog.sets ?? [];
                        const progScheduled = progSets.filter((s) => s.status === "ready").length;
                        const progTotal = progSets.length;
                        const progInDean =
                          progTotal > 0 &&
                          progSets.every((s) => s.releaseStatus === "pending_dean_review");
                        const progCanSend =
                          dept.canSend &&
                          progSets.some(
                            (s) => s.releaseStatus === "draft" || s.releaseStatus === "rejected",
                          );

                        return (
                          <div
                            key={prog.programId}
                            className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                          >
                            <div>
                              <span className="text-xs font-semibold text-navy-700 dark:text-mist-100">
                                {prog.programAbbrev} — {prog.programName}
                              </span>
                              <span className="ml-2 text-xs text-slate-400">
                                ({progScheduled}/{progTotal} scheduled)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {phaseData.phase === "generation" && !progInDean && (
                                <Button
                                  type="button"
                                  block={false}
                                  disabled={!progCanSend || actionLoading}
                                  onClick={() =>
                                    setSendProgramTarget({
                                      programId: prog.programId,
                                      programAbbrev: prog.programAbbrev,
                                    })
                                  }
                                >
                                  Send Program
                                </Button>
                              )}

                              {phaseData.phase === "generation" && progInDean && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  block={false}
                                  disabled={actionLoading}
                                  onClick={() => handleWithdrawProgram(prog.programId)}
                                >
                                  Withdraw
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Card 4: Suggestion Resolution & Solver */}
          <Card className={activePanel === "resolution" ? "p-5 sm:p-6" : "hidden"}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
              <div>
                <h2 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
                  Suggestion Resolution Pass
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Global solver pass maximizing satisfied requests. Clashes with protected majors are reported for Registrar decision.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  isLoading={previewLoading}
                  loadingLabel="Previewing…"
                  onClick={handlePreviewResolution}
                >
                  Preview Resolution
                </Button>
              </div>
            </div>

            {resolution ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={resolution.committed ? "emerald" : "gold"}>
                    {resolution.committed ? "Committed" : "Preview — Nothing Applied"}
                  </Badge>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-emerald-600">
                      {resolution.stats?.satisfied ?? 0} Satisfied
                    </span>{" "}
                    ·{" "}
                    <span className="font-semibold text-red-600">
                      {resolution.stats?.rejected ?? 0} Rejected
                    </span>{" "}
                    ·{" "}
                    <span className="font-semibold text-amber-600">
                      {resolution.stats?.blockedByMajor ?? 0} Blocked by Major
                    </span>
                    {resolution.stats?.seconds != null && ` (${resolution.stats.seconds}s)`}
                  </span>
                </div>

                {/* Outcomes Table */}
                {resolutionOutcomes.length === 0 ? (
                  <p className="text-xs text-slate-400">No suggestions submitted for this term.</p>
                ) : (
                  <Table>
                    <TableHead>
                      <TableHeader>Section</TableHeader>
                      <TableHeader>Subject</TableHeader>
                      <TableHeader>Outcome</TableHeader>
                      <TableHeader>Details / Reason</TableHeader>
                    </TableHead>
                    <TableBody>
                      {resolutionOutcomes.map((item) => {
                        let tone: BadgeTone = "slate";
                        if (item.outcome === "satisfied") tone = "emerald";
                        else if (item.outcome === "rejected") tone = "red";
                        else if (item.outcome === "blocked_by_major") tone = "gold";

                        return (
                          <TableRow key={item.responseId}>
                            <TableCell className="font-medium text-navy-700 dark:text-mist-100">
                              {item.setName ?? "—"}
                            </TableCell>
                            <TableCell>{item.subjectCode ?? "—"}</TableCell>
                            <TableCell>
                              <Badge tone={tone}>
                                {item.outcome === "blocked_by_major"
                                  ? "Blocked by Major"
                                  : item.outcome}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                              {item.reason ?? (item.outcome === "satisfied" ? `Applied (${item.moves} moves)` : "—")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400">
                No resolution run recorded yet. Click &quot;Preview Resolution&quot; to test or advance the phase to resolve.
              </p>
            )}
          </Card>

          {/* Card 5: Stage Movement Actions */}
          <Card className={activePanel === "overview" ? "border-sky-200 bg-sky-50/40 p-5 dark:border-sky-900/60 dark:bg-sky-950/10 sm:p-6" : "hidden"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">Next step</p>
                <h2 className="mt-1 font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                  Continue the term workflow
                </h2>
              </div>
              <Badge tone={detailStage === "finalized" ? "emerald" : "sky"}>{workflowTitle}</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Complete the available backend milestone below. The next stage unlocks only when its required reviews are finished.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {detailStage === "major_scheduling" && (
                <Button
                  type="button"
                  block={false}
                  isLoading={actionLoading}
                  onClick={() => handleAdvancePhase("close_majors")}
                >
                  Close Majors &amp; Start Generation
                </Button>
              )}

              {detailStage === "generation" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    disabled={actionLoading}
                    isLoading={actionLoading}
                    onClick={handleRewindPhase}
                  >
                    ← Step Back to Major Scheduling
                  </Button>
                  <Button
                    type="button"
                    block={false}
                    disabled={!readiness?.isReady || actionLoading}
                    isLoading={actionLoading}
                    onClick={() => handleAdvancePhase("distribute")}
                  >
                    Distribute Complete Term for Dean Review
                  </Button>
                </>
              )}

              {detailStage === "suggestion_window" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    disabled={actionLoading}
                    isLoading={actionLoading}
                    onClick={handleRewindPhase}
                  >
                    ← Step Back to Generation
                  </Button>
                  <Button
                    type="button"
                    block={false}
                    disabled={actionLoading || (!termDistributed && !readiness?.isReady)}
                    isLoading={actionLoading}
                    onClick={() => handleAdvancePhase(termDistributed ? "resolve" : "distribute")}
                  >
                    {termDistributed ? "Close Shift Requests & Resolve Term" : "Distribute Complete Term for Dean Review"}
                  </Button>
                </>
              )}

              {["resolution", "final_approval", "ready_for_publication"].includes(detailStage ?? "") && (
                <>
                  {!termDistributed ? (
                    <>
                      <p className="basis-full text-sm text-amber-700 dark:text-gold-300">
                        This term was resolved before it was distributed. Send all complete schedules through initial Dean review before final approval or publication.
                      </p>
                      <Button
                        type="button"
                        block={false}
                        disabled={actionLoading || !readiness?.isReady}
                        isLoading={actionLoading}
                        onClick={() => handleAdvancePhase("distribute")}
                      >
                        Distribute Complete Term for Dean Review
                      </Button>
                    </>
                  ) : (
                    <>
                  {(awaitingInitialDeanReview > 0 || awaitingFinalDeanApproval > 0 || !allSetsApproved) && (
                    <p className="basis-full text-sm text-slate-600 dark:text-slate-300">
                      {awaitingInitialDeanReview > 0
                        ? `${awaitingInitialDeanReview} set(s) still need initial Dean review before they can enter the final-approval step.`
                        : awaitingFinalDeanApproval > 0
                          ? `${awaitingFinalDeanApproval} set(s) are waiting for final Dean approval.`
                          : "Publication remains unavailable until every set is finally approved by its Dean."}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    disabled={actionLoading || awaitingInitialDeanReview > 0}
                    isLoading={actionLoading}
                    onClick={() => handleAdvancePhase("forward_for_approval")}
                  >
                    Return Term for Final Dean Approval
                  </Button>
                  <Button
                    type="button"
                    block={false}
                    disabled={detailStage !== "ready_for_publication" || actionLoading}
                    isLoading={actionLoading}
                    onClick={() => setFinalizeConfirmOpen(true)}
                  >
                    Finalize &amp; Publish Term
                  </Button>
                    </>
                  )}
                </>
              )}

              {detailStage === "finalized" && (
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="emerald">
                    ✓ Term Finalized &amp; Published to All Users
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={finalizeConfirmOpen}
        onClose={() => setFinalizeConfirmOpen(false)}
        title="Finalize and publish this term?"
        confirmLabel="Finalize & Publish Term"
        loadingLabel="Publishing…"
        onConfirm={async () => {
          if (await handleAdvancePhase("finalize")) setFinalizeConfirmOpen(false);
        }}
      >
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            This publishes the complete term only when every required section has final Dean approval.
          </p>
          <p>
            Students and instructors will then be able to view the approved schedules. Later changes use the controlled reopen/edit workflow.
          </p>
        </div>
      </ConfirmDialog>

      {/* Reopening Majors Confirmation Modal */}
      <ConfirmDialog
        open={reopenMajorsModalOpen}
        onClose={() => setReopenMajorsModalOpen(false)}
        title="Reopen Major Scheduling?"
        confirmLabel="Extend Deadline & Reopen"
        loadingLabel="Reopening…"
        onConfirm={() => handleSaveDeadlines(true)}
      >
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Every department will be able to edit and submit majors again, and the term returns to the major scheduling phase.
          </p>
          <p>
            Schedules generated under the old deadline will go back to draft.
          </p>
          <div className="mt-3">
            <Checkbox
              id="discard-generated"
              label="Also delete those generated schedules (sets holding protected majors are kept)"
              checked={discardGenerated}
              onChange={(c: boolean) => setDiscardGenerated(c)}
            />
          </div>
        </div>
      </ConfirmDialog>

      <Modal open={windowTarget !== null} onClose={() => setWindowTarget(null)} title={`Open ${windowTarget === "major" ? "Major Scheduling" : "Shift Request"} Window`}>
        <div className="space-y-4">
          <DateTimePicker
            id="window-closing-at"
            label="Closes at"
            value={windowClosingAt}
            onChange={setWindowClosingAt}
            keepPopoverBelow
          />
          {schedulingWindows?.openWindow && schedulingWindows.openWindow !== windowTarget && <p className="text-sm text-amber-700 dark:text-amber-300">Opening this window closes the active {schedulingWindows.windows[schedulingWindows.openWindow].label} window.</p>}
          <ModalActions><Button type="button" variant="outline" block={false} onClick={() => setWindowTarget(null)}>Cancel</Button><Button type="button" block={false} disabled={!windowClosingAt} isLoading={actionLoading} loadingLabel="Opening…" onClick={() => void handleOpenWindow(Boolean(schedulingWindows?.openWindow && schedulingWindows.openWindow !== windowTarget))}>Open window</Button></ModalActions>
        </div>
      </Modal>

      <ConfirmDialog
        open={windowConfirmation !== null}
        onClose={() => setWindowConfirmation(null)}
        title={windowConfirmation?.title ?? "Confirm scheduling window"}
        confirmLabel={windowConfirmation?.confirmLabel ?? "Confirm"}
        loadingLabel="Opening…"
        onConfirm={async () => {
          await handleOpenWindow(true);
          setWindowConfirmation(null);
        }}
      >
        <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
          {windowConfirmation?.body}
        </p>
      </ConfirmDialog>

      {/* Send Program Modal */}
      <Modal
        open={sendProgramTarget !== null}
        onClose={() => setSendProgramTarget(null)}
        title={`Send ${sendProgramTarget?.programAbbrev ?? ""} to its Dean`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This sends all sections under {sendProgramTarget?.programAbbrev} to its Dean for review. You can include an optional note.
          </p>
          <Textarea
            id="program-send-note"
            label="Submission Note (Optional)"
            value={sendProgramNote}
            onChange={(e) => setSendProgramNote(e.target.value)}
          />
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setSendProgramTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              block={false}
              isLoading={actionLoading}
              loadingLabel="Sending…"
              onClick={handleSendProgram}
            >
              Send Program
            </Button>
          </ModalActions>
        </div>
      </Modal>
    </div>
  );
}
