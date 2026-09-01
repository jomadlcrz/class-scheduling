import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { DatePicker } from "~/components/ui/date-picker";
import { Drawer } from "~/components/ui/drawer";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  InfoCircleIcon,
  LockIcon,
  ShieldIcon,
} from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { ConfirmDialog, Modal, ModalActions } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { Stepper, type StepDefinition } from "~/components/ui/stepper";
import { Tooltip } from "~/components/ui/tooltip";
import { EditRequestAttemptMeter } from "~/features/schedules/edit-request-attempt-meter";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { ApiError } from "~/lib/api";
import { termPhaseService } from "~/services/term-phase.service";
import type {
  MajorEditRequestAttemptSummary,
  SchedulingWindowsSnapshot,
  TermDistributionReadiness,
  TermPhaseItem,
  TermPhaseResponse,
  TermResponseReadiness,
  TermSchedulingPhase,
} from "~/types/term-phase";

/* -------------------------------------------------------------------------- */
/*                               Date Helpers                                 */
/* -------------------------------------------------------------------------- */

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
  return date ? `${date}T${time || "17:00"}` : "";
}

function formatDeadline(isoString: string | null): string {
  if (!isoString) return "Not set";
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return isoString;
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function deadlineDistance(targetIso: string | null, serverTimeIso: string | null): string | null {
  if (!targetIso || !serverTimeIso) return null;
  const target = new Date(targetIso).getTime();
  const server = new Date(serverTimeIso).getTime();
  if (Number.isNaN(target) || Number.isNaN(server)) return null;

  const diffMinutes = Math.round((target - server) / 60000);
  const past = diffMinutes < 0;
  const minutes = Math.abs(diffMinutes);

  const text =
    minutes < 60
      ? `${minutes} minute${minutes === 1 ? "" : "s"}`
      : minutes < 60 * 24
        ? `${Math.round(minutes / 60)} hour${Math.round(minutes / 60) === 1 ? "" : "s"}`
        : `${Math.round(minutes / (60 * 24))} day${Math.round(minutes / (60 * 24)) === 1 ? "" : "s"}`;

  return past ? `${text} ago` : `in ${text}`;
}

function DateTimePickerField({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
      <DatePicker
        id={`${id}-date`}
        label={label}
        value={datePart(value)}
        disabled={disabled}
        onChange={(date) => onChange(mergeLocalDateTime(date, timePart(value) || "17:00"))}
      />
      <Input
        id={`${id}-time`}
        label="Time"
        type="time"
        value={timePart(value) || "17:00"}
        disabled={disabled}
        onChange={(event) => onChange(mergeLocalDateTime(datePart(value), event.target.value))}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Phase Guidance & Copy                            */
/* -------------------------------------------------------------------------- */

const PHASE_RULES: Record<TermSchedulingPhase, string[]> = {
  major_scheduling: [
    "Every department's submitted major schedules lock as constraints.",
    "A department that has not finished blocks Shift Request until it completes the workflow.",
    "Major Scheduling can be reopened only before Shift Request starts.",
    "Generation can begin — nothing is released until you send it.",
  ],
  generation: [],
  suggestion_window: [
    "Instructors can no longer accept or suggest.",
    "Anyone who did not answer is treated as having accepted.",
    "Suggestions are resolved together, not first-come-first-served.",
  ],
  resolution: [],
  finalized: [],
};

const PHASE_SUMMARIES: Record<TermSchedulingPhase, string> = {
  major_scheduling: "Deans are submitting major-subject schedules across all departments.",
  generation: "Schedules are being generated. Nothing is released while this runs.",
  suggestion_window: "Instructors are accepting or proposing changes within their attempt limits.",
  resolution: "The shift request is closed and suggestions are being resolved.",
  finalized: "The term schedule is published. Further changes use an edit request.",
};

const PHASE_SUMMARIES_CLOSED: Partial<Record<TermSchedulingPhase, string>> = {
  major_scheduling: "Major scheduling is closed. Submitted majors are locked as constraints.",
  suggestion_window: "The shift request is closed. Anyone who did not respond accepted their schedule.",
};

const SCHEDULING_STEPS: StepDefinition[] = [
  { key: "start", label: "Start" },
  { key: "open", label: "Open" },
  { key: "close", label: "Close" },
];

/* -------------------------------------------------------------------------- */
/*                           Rules Drawer Component                           */
/* -------------------------------------------------------------------------- */

function RuleSection({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-slate-200/80 pb-5 last:border-b-0 last:pb-0 dark:border-white/10">
      <span className="grid size-8 place-items-center rounded-lg bg-navy-800/10 font-body text-xs font-semibold tabular-nums text-navy-800 dark:bg-white/8 dark:text-sky-200">
        {number}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">{title}</h3>
        <div className="mt-1.5 font-body text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</div>
      </div>
    </section>
  );
}

function TermCalendarRulesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Scheduling Calendar Rules"
      description="How major scheduling, shift requests, and term publication are governed."
      wide
    >
      <div className="flex flex-col gap-5 overscroll-contain">
        <RuleSection number={1} title="Purpose & Authority">
          <p>
            The scheduling calendar is the college-wide authority for when each group may act. It coordinates
            when Deans submit majors, when instructors submit shift requests, and when the term is finalized.
          </p>
        </RuleSection>

        <RuleSection number={2} title="Major Scheduling (Deans)">
          <ul className="ml-4 list-disc space-y-1.5 marker:text-gold-500">
            <li>Deans place and submit protected major-subject schedules for their departments.</li>
            <li>Submitted majors lock as rigid constraints for all timetable generation.</li>
            <li>Deans have an institution-wide edit request attempt limit while Major Scheduling is open.</li>
          </ul>
        </RuleSection>

        <RuleSection number={3} title="Shift Request (Instructors)">
          <ul className="ml-4 list-disc space-y-1.5 marker:text-gold-500">
            <li>After generation and initial Dean review, Shift Request opens for all instructors.</li>
            <li>Instructors can accept their schedule or propose alternative valid slots.</li>
            <li>Each instructor has a configurable suggestion attempt limit.</li>
            <li>Instructors who do not respond by the deadline automatically accept their schedule.</li>
          </ul>
        </RuleSection>

        <RuleSection number={4} title="One-Way Boundary Rule">
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            <strong>Critical Boundary:</strong> Once Shift Request opens for the first time, Major Scheduling is
            permanently locked for the term. Majors cannot be reopened or edited once instructor review begins.
          </div>
        </RuleSection>

        <RuleSection number={5} title="Resolution & Final Approval">
          <ul className="ml-4 list-disc space-y-1.5 marker:text-gold-500">
            <li>When Shift Request closes, the global solver resolves all suggestions together.</li>
            <li>Resolved schedules return to Deans for final sign-off.</li>
            <li>Once every required program is approved, the Registrar finalizes and publishes the term.</li>
          </ul>
        </RuleSection>
      </div>
    </Drawer>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Main Page Component                             */
/* -------------------------------------------------------------------------- */

export function TermCalendarPage() {
  const [searchParams] = useSearchParams();
  const initialSyId = searchParams.get("syId") ?? "";
  const initialSemesterNumber = searchParams.get("semesterNumber") ?? "";

  const { schoolYears, defaultSchoolYear, loading: termsLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState(initialSyId);
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState(initialSemesterNumber);

  const [phaseData, setPhaseData] = useState<TermPhaseResponse | null>(null);
  const [readiness, setReadiness] = useState<TermDistributionReadiness | null>(null);
  const [responseReadiness, setResponseReadiness] = useState<TermResponseReadiness | null>(null);
  const [majorEditAttempts, setMajorEditAttempts] = useState<MajorEditRequestAttemptSummary | null>(null);
  const [schedulingWindows, setSchedulingWindows] = useState<SchedulingWindowsSnapshot | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Phase Tab: "major_scheduling" or "suggestion_window"
  const [activeTab, setActiveTab] = useState<"major_scheduling" | "suggestion_window">("major_scheduling");

  // Draft closing dates
  const [draftClosingDate, setDraftClosingDate] = useState<string>("");
  const [savingDeadline, setSavingDeadline] = useState(false);

  // Limit drafts
  const [majorEditLimitDraft, setMajorEditLimitDraft] = useState("2");
  const [savingMajorEditLimit, setSavingMajorEditLimit] = useState(false);
  const [suggestionLimitDraft, setSuggestionLimitDraft] = useState("1");
  const [savingSuggestionLimit, setSavingSuggestionLimit] = useState(false);

  // Modals & Action States
  const [rulesDrawerOpen, setRulesDrawerOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [closeNowModalOpen, setCloseNowModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [discardGenerated, setDiscardGenerated] = useState(false);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [shiftRequestChallenge, setShiftRequestChallenge] = useState<{
    title: string;
    body: string;
    confirmLabel: string;
    closingAt: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Initial selection
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
      const [phaseRes, readyRes, windowsRes, editAttemptsRes, respReadinessRes] = await Promise.all([
        termPhaseService.getTermPhase(syId, semesterNumber),
        termPhaseService.getDistributionReadiness(syId, semesterNumber).catch(() => null),
        termPhaseService.getSchedulingWindows(syId, semesterNumber).catch(() => null),
        termPhaseService.getMajorEditRequestAttempts(syId, semesterNumber).catch(() => null),
        termPhaseService.getResponseReadiness(syId, semesterNumber).catch(() => null),
      ]);
      setPhaseData(phaseRes);
      setReadiness(readyRes);
      setSchedulingWindows(windowsRes ?? phaseRes.schedulingWindows ?? null);
      setMajorEditAttempts(editAttemptsRes);
      setResponseReadiness(respReadinessRes);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync draft closing date when switching tabs or loading phase data
  useEffect(() => {
    if (!phaseData) return;
    if (activeTab === "major_scheduling") {
      setDraftClosingDate(toLocalDatetimeInput(phaseData.majorsDueAt));
    } else {
      setDraftClosingDate(toLocalDatetimeInput(phaseData.suggestionsDueAt));
    }
  }, [activeTab, phaseData]);

  // Derived state for the active tab
  const activePhaseRow: TermPhaseItem | undefined = useMemo(() => {
    return phaseData?.phases.find((p) => p.phase === activeTab);
  }, [phaseData, activeTab]);

  const activeSavedDeadline = activeTab === "major_scheduling" ? phaseData?.majorsDueAt : phaseData?.suggestionsDueAt;
  const isLapsed = activeTab === "major_scheduling" ? phaseData?.majorsDeadlinePassed : phaseData?.suggestionsDeadlinePassed;
  const isRunning = Boolean(phaseData?.governed && activePhaseRow?.isOpen);
  const closedAndGone = Boolean(activePhaseRow && (activePhaseRow.isPast || isLapsed));

  // Stepper calculations
  const currentStepIndex = closedAndGone ? 2 : isRunning ? 1 : 0;
  const maxUnlockedIndex = currentStepIndex;

  const majorReopenLocked = activeTab === "major_scheduling" && !phaseData?.gates.majorReopenAllowed;
  const canStartShiftRequest =
    activeTab === "suggestion_window" &&
    phaseData?.detailStage === "ready_for_suggestions" &&
    !closedAndGone;

  const serverTime = phaseData?.serverTime ?? new Date().toISOString();

  /* -------------------------------------------------------------------------- */
  /*                               Action Handlers                              */
  /* -------------------------------------------------------------------------- */

  async function handleSaveClosingDate() {
    if (!syId || !semesterNumber || !phaseData) return;
    setSavingDeadline(true);
    try {
      const fieldKey = activeTab === "major_scheduling" ? "majorsDueAt" : "suggestionsDueAt";
      const isoValue = draftClosingDate ? new Date(draftClosingDate).toISOString() : null;

      const res = await termPhaseService.setDeadlines(syId, semesterNumber, {
        [fieldKey]: isoValue,
      });
      toast.success(res.message || "Closing date updated.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save closing date.");
    } finally {
      setSavingDeadline(false);
    }
  }

  async function handleStartPhase(closingAt: string, confirmed = false) {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      if (activeTab === "suggestion_window") {
        const res = await termPhaseService.openSchedulingWindow(
          syId,
          semesterNumber,
          "suggestion",
          new Date(closingAt).toISOString(),
          confirmed,
        );
        toast.success(res.message);
        setStartModalOpen(false);
        setShiftRequestChallenge(null);
        await loadData();
      } else {
        const res = await termPhaseService.setDeadlines(syId, semesterNumber, {
          majorsDueAt: new Date(closingAt).toISOString(),
        });
        toast.success(res.message || "Major Scheduling started.");
        setStartModalOpen(false);
        await loadData();
      }
    } catch (err) {
      const details = err instanceof ApiError ? err.details : null;
      const extra = details?.extra && typeof details.extra === "object" ? (details.extra as Record<string, unknown>) : details;
      const confirmation = extra?.confirmation as Record<string, string> | undefined;

      if (confirmation && typeof confirmation.title === "string") {
        setShiftRequestChallenge({
          title: confirmation.title,
          body: confirmation.body,
          confirmLabel: confirmation.confirmLabel,
          closingAt,
        });
        return;
      }
      toast.error(err instanceof Error ? err.message : "Failed to start phase.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClosePhaseNow() {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      if (activeTab === "major_scheduling") {
        const res = await termPhaseService.advancePhase(syId, semesterNumber, "close_majors");
        toast.success(res.message || "Major Scheduling closed.");
      } else {
        const res = await termPhaseService.advancePhase(syId, semesterNumber, "resolve");
        toast.success(res.message || "Shift Request closed & resolving.");
      }
      setCloseNowModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close phase.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReopenPhase(newClosingAt: string) {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      await termPhaseService.openPhase(syId, semesterNumber, activeTab);
      const fieldKey = activeTab === "major_scheduling" ? "majorsDueAt" : "suggestionsDueAt";
      const res = await termPhaseService.setDeadlines(syId, semesterNumber, {
        [fieldKey]: new Date(newClosingAt).toISOString(),
        discardGenerated: activeTab === "major_scheduling" ? discardGenerated : false,
      });
      toast.success(res.message || "Phase reopened.");
      setReopenModalOpen(false);
      setDiscardGenerated(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reopen phase.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFinalizeAndPublish() {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      const res = await termPhaseService.advancePhase(syId, semesterNumber, "finalize");
      toast.success(res.message || "Term finalized and published.");
      setFinalizeModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to finalize and publish term.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveMajorEditLimit() {
    if (!syId || !semesterNumber) return;
    const limit = Number(majorEditLimitDraft);
    if (!Number.isInteger(limit) || limit < 1 || limit > 999) {
      toast.error("Enter a whole number between 1 and 999.");
      return;
    }
    setSavingMajorEditLimit(true);
    try {
      const res = await termPhaseService.saveMajorEditRequestLimit(syId, semesterNumber, limit);
      toast.success(res.message || "Major edit-request limit updated.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update limit.");
    } finally {
      setSavingMajorEditLimit(false);
    }
  }

  async function handleSaveSuggestionLimit() {
    if (!syId || !semesterNumber) return;
    const limit = Number(suggestionLimitDraft);
    if (!Number.isInteger(limit) || limit < 1 || limit > 999) {
      toast.error("Enter a whole number between 1 and 999.");
      return;
    }
    setSavingSuggestionLimit(true);
    try {
      const res = await termPhaseService.saveSuggestionAttemptLimit(syId, semesterNumber, limit);
      toast.success(res.message || "Suggestion attempt limit updated.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update limit.");
    } finally {
      setSavingSuggestionLimit(false);
    }
  }

  const termLabel = phaseData?.termLabel ?? "Term Scheduling Calendar";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 font-body space-y-6">
      {/* Header with Consistent Rules Drawer Button */}
      <PageHeader
        title="Scheduling Calendar"
        actions={
          <Button
            type="button"
            variant="outline"
            block={false}
            onClick={() => setRulesDrawerOpen(true)}
          >
            <InfoCircleIcon size={16} />
            Rules
          </Button>
        }
      />

      {/* Main Content Area */}
      {loading && !phaseData ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button type="button" variant="outline" className="mt-4" block={false} onClick={loadData}>
            Retry
          </Button>
        </Card>
      ) : phaseData ? (
        <div className="space-y-6">
          {phaseData.detailStage === "ready_for_publication" && (
            <Card className="flex flex-wrap items-center justify-between gap-4 border-emerald-300 bg-emerald-50/70 p-5 dark:border-emerald-700/40 dark:bg-emerald-950/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
                    Ready for Publication
                  </h3>
                  <Badge tone="emerald">All Deans Approved</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  All program schedules have completed Final Dean Approval. Finalizing publishes class timetables institution-wide to students and instructors.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                block={false}
                disabled={actionLoading}
                onClick={() => setFinalizeModalOpen(true)}
              >
                Finalize &amp; Publish Term
              </Button>
            </Card>
          )}

          {phaseData.detailStage === "finalized" && (
            <Card className="flex flex-wrap items-center justify-between gap-4 border-emerald-300 bg-emerald-50/70 p-5 dark:border-emerald-700/40 dark:bg-emerald-950/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
                    Term Finalized &amp; Published
                  </h3>
                  <Badge tone="emerald">Published</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Class schedules are live and published. Students and instructors can view their official timetables in their portals.
                </p>
              </div>
            </Card>
          )}

          {phaseData.detailStage === "final_approval" && (
            <Card className="flex flex-wrap items-center justify-between gap-4 border-sky-300 bg-sky-50/70 p-5 dark:border-sky-700/40 dark:bg-sky-950/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
                    Final Dean Approval in Progress
                  </h3>
                  <Badge tone="sky">Dean Sign-off</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Shift requests have been processed. Deans are currently conducting final reviews and signing off on their department schedules.
                </p>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            {/* Term Title */}
            <div className="px-5 pb-3 pt-5 text-center">
              <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">{termLabel}</h2>
            </div>

          {/* Phase Tab Strip */}
          <div className="border-b border-slate-200 dark:border-white/10">
            <div className="flex" role="tablist">
              {(
                [
                  { key: "major_scheduling", label: "Major Scheduling" },
                  { key: "suggestion_window", label: "Shift Request" },
                ] as const
              ).map((tab) => {
                const isSelected = activeTab === tab.key;
                const row = phaseData.phases.find((p) => p.phase === tab.key);
                const isOpen = phaseData.governed && (row?.isOpen ?? false);

                const centerBorderClass =
                  tab.key === "major_scheduling"
                    ? isSelected
                      ? "border-r border-gold-400"
                      : activeTab === "suggestion_window"
                        ? ""
                        : "border-r border-slate-200 dark:border-white/10"
                    : isSelected
                      ? "border-l border-gold-400"
                      : activeTab === "major_scheduling"
                        ? ""
                        : "border-l border-slate-200 dark:border-white/10";

                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 py-3.5 transition-colors ${centerBorderClass} ${
                      isSelected
                        ? "border-b-2 border-gold-400 bg-white dark:bg-navy-900"
                        : "bg-slate-50/60 text-slate-500 hover:bg-slate-100/60 dark:bg-white/2.5 dark:text-slate-400 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className={`text-sm ${isSelected ? "font-semibold text-navy-800 dark:text-mist-100" : ""}`}>
                      {tab.label}
                    </span>
                    <Badge tone={isOpen ? "emerald" : "slate"}>{isOpen ? "Open now" : "Closed"}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Body */}
          <div className="flex flex-col items-center p-6 text-center space-y-6">
            {/* Phase Title & Rules Tooltip */}
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl tracking-wide text-navy-800 dark:text-mist-100">
                {activeTab === "major_scheduling" ? "Major Scheduling" : "Shift Request"}
              </h3>
              {PHASE_RULES[activeTab].length > 0 && (
                <Tooltip wrap label={`When this deadline passes: ${PHASE_RULES[activeTab].join(" ")}`}>
                  <span className="cursor-help text-slate-400 hover:text-navy-700 dark:hover:text-mist-100">
                    <InfoCircleIcon size={16} />
                  </span>
                </Tooltip>
              )}
            </div>

            {/* Stage Description */}
            <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">
              {closedAndGone ? PHASE_SUMMARIES_CLOSED[activeTab] : PHASE_SUMMARIES[activeTab]}
            </p>

            {/* Institution-Wide Limit Widget for Major Scheduling */}
            {activeTab === "major_scheduling" && (
              <div className="w-full max-w-2xl rounded-xl bg-slate-50 p-4 text-left dark:bg-navy-800">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-800 dark:text-mist-100">
                        Institution-Wide Edit-Request Limit
                      </h4>
                      <Tooltip
                        wrap
                        label="The configured limit gives every Dean the same maximum number of Major Scheduling edit requests. Each submitted request consumes one attempt."
                      >
                        <span className="cursor-help text-slate-400 hover:text-navy-700">
                          <InfoCircleIcon size={15} />
                        </span>
                      </Tooltip>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      One limit applies equally to every Dean during Major Scheduling.
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
                      className="h-9 w-20 rounded-lg border border-slate-300 bg-white px-2.5 text-center font-body text-sm font-semibold tabular-nums text-navy-800 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-white/15 dark:bg-surface-raised dark:text-mist-100"
                    />
                    <Button
                      type="button"
                      block={false}
                      isLoading={savingMajorEditLimit}
                      loadingLabel="Saving"
                      disabled={savingMajorEditLimit || majorEditLimitDraft === String(phaseData.majorEditRequestLimit ?? 2)}
                      onClick={handleSaveMajorEditLimit}
                    >
                      Save limit
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
            )}

            {/* Instructor Suggestion Limit Widget for Shift Request */}
            {activeTab === "suggestion_window" && (
              <div className="w-full max-w-2xl rounded-xl bg-slate-50 p-4 text-left dark:bg-navy-800">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-800 dark:text-mist-100">
                        Instructor Suggestion Attempt Limit
                      </h4>
                      <Tooltip
                        wrap
                        label="The configured limit gives every instructor the same maximum number of suggestions. Only successful submissions consume an attempt."
                      >
                        <span className="cursor-help text-slate-400 hover:text-navy-700">
                          <InfoCircleIcon size={15} />
                        </span>
                      </Tooltip>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
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
                      className="h-9 w-20 rounded-lg border border-slate-300 bg-white px-2.5 text-center font-body text-sm font-semibold tabular-nums text-navy-800 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-white/15 dark:bg-surface-raised dark:text-mist-100"
                    />
                    <Button
                      type="button"
                      block={false}
                      isLoading={savingSuggestionLimit}
                      loadingLabel="Saving"
                      disabled={savingSuggestionLimit || suggestionLimitDraft === String(phaseData.suggestionAttemptLimit ?? 1)}
                      onClick={handleSaveSuggestionLimit}
                    >
                      Save limit
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
            )}

            {/* Reusable Stepper Component (Read-only Phase Progress) */}
            <div className="w-full max-w-2xl">
              <Stepper
                steps={SCHEDULING_STEPS}
                currentIndex={currentStepIndex}
                readOnly
              />
            </div>

            {/* Stepper Actions based on current step index */}
            {currentStepIndex === 0 && (
              <div className="space-y-3">
                {activeTab === "suggestion_window" && !canStartShiftRequest ? (
                  <div className="max-w-md space-y-2">
                    <Button block={false} disabled>
                      Start Shift Request
                    </Button>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {phaseData.detailStage === "generation" ? (
                        <>
                          Schedules are still generating. Complete and send department schedules through Master Schedules first.
                        </>
                      ) : phaseData.detailStage === "initial_review" ? (
                        <>
                          Departments are in initial Dean review. Every required section must reach instructor review before Shift Request opens.
                        </>
                      ) : (
                        "Major Scheduling must close before Shift Request can start."
                      )}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Button block={false} onClick={() => setStartModalOpen(true)}>
                      Start {activeTab === "major_scheduling" ? "Major Scheduling" : "Shift Request"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {currentStepIndex === 1 && (
              <div className="w-full max-w-sm space-y-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {activeSavedDeadline ? (
                    <>
                      Open. Closes {formatDeadline(activeSavedDeadline)}
                      {deadlineDistance(activeSavedDeadline, serverTime)
                        ? ` · ${deadlineDistance(activeSavedDeadline, serverTime)}`
                        : ""}
                    </>
                  ) : (
                    "Open with no closing date set."
                  )}
                </p>

                <div className="text-left">
                  <DateTimePickerField
                    id={`deadline-${activeTab}`}
                    label="Adjust Closing Date"
                    value={draftClosingDate}
                    onChange={setDraftClosingDate}
                  />
                </div>

                {activeTab === "suggestion_window" && responseReadiness && (
                  <div className="rounded-xl bg-slate-50 p-3 text-left text-xs text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                    <p className="font-semibold text-navy-800 dark:text-mist-100">
                      Instructor Responses: {responseReadiness.respondedCount ?? 0} of {responseReadiness.expected ?? 0}
                    </p>
                    <p className="mt-0.5 text-slate-500">
                      {(responseReadiness.silentCount ?? 0) > 0
                        ? `${responseReadiness.silentCount} silent. Silence at deadline is automatic acceptance.`
                        : "All instructors have responded."}
                    </p>
                    {responseReadiness.canCloseEarly && (
                      <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ All responded — ready to close early and resolve.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    block={false}
                    disabled={savingDeadline}
                    isLoading={savingDeadline}
                    loadingLabel="Saving"
                    onClick={handleSaveClosingDate}
                  >
                    Save closing date
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    onClick={() => setCloseNowModalOpen(true)}
                  >
                    Close now
                  </Button>
                </div>
              </div>
            )}

            {currentStepIndex === 2 && (
              <div className="space-y-3">
                {majorReopenLocked ? (
                  <div className="max-w-md space-y-2">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      <LockIcon /> Permanently locked for this term.
                    </p>
                    <div>
                      <Button variant="outline" block={false} disabled>
                        Reopen Major Scheduling
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Shift Request has already started. Major Scheduling cannot be reopened or extended after instructor review begins.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                      <LockIcon /> Closed {formatDeadline(activeSavedDeadline ?? null)}.
                    </p>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        block={false}
                        onClick={() => {
                          setDraftClosingDate("");
                          setReopenModalOpen(true);
                        }}
                      >
                        Reopen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    ) : null}

      {/* Start Phase Dialog */}
      <Modal
        open={startModalOpen}
        onClose={() => setStartModalOpen(false)}
        title={`Start ${activeTab === "major_scheduling" ? "Major Scheduling" : "Shift Request"}`}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="text-xs text-slate-500">
            Set the closing date for this phase. When the deadline arrives, the phase closes automatically.
          </p>
          <DateTimePickerField
            id="start-phase-date"
            label="Closing Date & Time"
            value={draftClosingDate}
            onChange={setDraftClosingDate}
          />
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setStartModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              block={false}
              disabled={!draftClosingDate || actionLoading}
              isLoading={actionLoading}
              loadingLabel="Starting…"
              onClick={() => handleStartPhase(draftClosingDate)}
            >
              Start Phase
            </Button>
          </ModalActions>
        </div>
      </Modal>

      {/* Close Now Confirm Dialog */}
      <ConfirmDialog
        open={closeNowModalOpen}
        onClose={() => setCloseNowModalOpen(false)}
        title={`Close ${activeTab === "major_scheduling" ? "Major Scheduling" : "Shift Request"} now?`}
        confirmLabel="Close now"
        loadingLabel="Closing…"
        confirmVariant="danger"
        onConfirm={handleClosePhaseNow}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {activeTab === "major_scheduling"
            ? "Submitted major schedules will lock as constraints and generation can begin. Major Scheduling can only be reopened before Shift Request starts."
            : "No further suggestions will be accepted. Instructors who did not respond are treated as having accepted their given schedule."}
        </p>
      </ConfirmDialog>

      {/* Reopen Phase Modal */}
      <Modal
        open={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title={`Reopen ${activeTab === "major_scheduling" ? "Major Scheduling" : "Shift Request"}`}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="text-xs text-slate-500">
            {activeTab === "major_scheduling"
              ? "Set a new closing date. Deans can edit majors again. Schedules generated under the old deadline return to draft."
              : "Set a new closing date. Instructors can respond again until the new deadline arrives."}
          </p>
          <DateTimePickerField
            id="reopen-phase-date"
            label="New Closing Date"
            value={draftClosingDate}
            onChange={setDraftClosingDate}
          />
          {activeTab === "major_scheduling" && (
            <div className="pt-2">
              <Checkbox
                id="reopen-discard-generated"
                label="Also delete previously generated draft schedules"
                checked={discardGenerated}
                onChange={(c: boolean) => setDiscardGenerated(c)}
              />
            </div>
          )}
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setReopenModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              block={false}
              disabled={!draftClosingDate || actionLoading}
              isLoading={actionLoading}
              loadingLabel="Reopening…"
              onClick={() => handleReopenPhase(draftClosingDate)}
            >
              Reopen Phase
            </Button>
          </ModalActions>
        </div>
      </Modal>

      {/* Shift Request First Opening Challenge Modal */}
      <ConfirmDialog
        open={shiftRequestChallenge !== null}
        onClose={() => setShiftRequestChallenge(null)}
        title={shiftRequestChallenge?.title ?? "Start Shift Request?"}
        confirmLabel={shiftRequestChallenge?.confirmLabel ?? "Confirm"}
        loadingLabel="Starting…"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!shiftRequestChallenge) return;
          await handleStartPhase(shiftRequestChallenge.closingAt, true);
        }}
      >
        <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
          {shiftRequestChallenge?.body}
        </p>
      </ConfirmDialog>

      {/* Finalize & Publish Term Dialog */}
      <ConfirmDialog
        open={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        title="Finalize & Publish Term Schedules?"
        confirmLabel="Finalize & Publish"
        loadingLabel="Publishing…"
        confirmVariant="primary"
        onConfirm={handleFinalizeAndPublish}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This will officially finalize all approved schedules and publish them to student and faculty portals. This action is the final step in the term scheduling workflow.
        </p>
      </ConfirmDialog>

      {/* Reusable Rules Drawer */}
      <TermCalendarRulesDrawer open={rulesDrawerOpen} onClose={() => setRulesDrawerOpen(false)} />
    </div>
  );
}
