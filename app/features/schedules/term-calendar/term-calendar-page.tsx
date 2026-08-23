import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { FieldChrome, Input } from "~/components/ui/input";
import { Modal, ModalActions, ConfirmDialog } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { termPhaseService } from "~/services/term-phase.service";
import type {
  DepartmentReadinessResponse,
  TermDistributionReadiness,
  TermPhaseResponse,
  TermResolutionRun,
} from "~/types/term-phase";
import { TERM_SCHEDULING_PHASE_LABELS, TERM_SCHEDULING_PHASE_ORDER } from "~/types/term-phase";

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

export function TermCalendarPage() {
  const { schoolYears, defaultSchoolYear, loading: termsLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState("");

  const [phaseData, setPhaseData] = useState<TermPhaseResponse | null>(null);
  const [readiness, setReadiness] = useState<TermDistributionReadiness | null>(null);
  const [deptReadiness, setDeptReadiness] = useState<DepartmentReadinessResponse | null>(null);
  const [resolution, setResolution] = useState<TermResolutionRun | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deadlines Form State
  const [majorsDueAtInput, setMajorsDueAtInput] = useState("");
  const [suggestionsDueAtInput, setSuggestionsDueAtInput] = useState("");
  const [savingDeadlines, setSavingDeadlines] = useState(false);

  // Modals State
  const [reopenMajorsModalOpen, setReopenMajorsModalOpen] = useState(false);
  const [discardGenerated, setDiscardGenerated] = useState(false);
  const [sendProgramTarget, setSendProgramTarget] = useState<{ programId: number; programAbbrev: string } | null>(null);
  const [sendProgramNote, setSendProgramNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

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
      const [phaseRes, readyRes, deptRes, resRun] = await Promise.all([
        termPhaseService.getTermPhase(syId, semesterNumber),
        termPhaseService.getDistributionReadiness(syId, semesterNumber).catch(() => null),
        termPhaseService.getDepartmentReadiness(syId, semesterNumber).catch(() => null),
        termPhaseService.getResolution(syId, semesterNumber).catch(() => null),
      ]);
      setPhaseData(phaseRes);
      setReadiness(readyRes);
      setDeptReadiness(deptRes);
      setResolution(resRun);
      setMajorsDueAtInput(toLocalDatetimeInput(phaseRes.majorsDueAt));
      setSuggestionsDueAtInput(toLocalDatetimeInput(phaseRes.suggestionsDueAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load term scheduling calendar.");
    } finally {
      setLoading(false);
    }
  }, [syId, semesterNumber]);

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

  async function handleAdvancePhase(action: "close_majors" | "distribute" | "resolve" | "forward_for_approval" | "finalize") {
    if (!syId || !semesterNumber) return;
    setActionLoading(true);
    try {
      const res = await termPhaseService.advancePhase(syId, semesterNumber, action);
      toast.success(res.message || "Term phase advanced successfully.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to advance phase.");
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

  const currentPhaseIndex = phaseData
    ? TERM_SCHEDULING_PHASE_ORDER.indexOf(phaseData.phase)
    : 0;

  const unscheduledList = readiness?.unscheduled ?? [];
  const incompleteList = readiness?.incomplete ?? [];
  const resolutionOutcomes = resolution?.outcome ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 font-body">
      <PageHeader title="Term Scheduling Calendar" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          {/* Card 1: Phase Progress Overview */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Term Status</span>
                <h1 className="mt-1 font-display text-2xl tracking-wide text-navy-800 dark:text-mist-100">{phaseData.phaseLabel}</h1>
              </div>
              <Badge tone={phaseData.governed ? "navy" : "slate"}>{phaseData.governed ? "Governed" : "Ungoverned"}</Badge>
            </div>

            {/* Timeline steps */}
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-5">
              {TERM_SCHEDULING_PHASE_ORDER.map((stepPhase, idx) => {
                const isCurrent = phaseData.phase === stepPhase;
                const isPast = idx < currentPhaseIndex;
                const deadlineField = stepPhase === "major_scheduling" ? phaseData.majorsDueAt : stepPhase === "suggestion_window" ? phaseData.suggestionsDueAt : null;

                return (
                  <div
                    key={stepPhase}
                    className={`flex flex-col justify-between rounded-lg border p-3 transition-colors ${
                      isCurrent
                        ? "border-sky-500 bg-sky-50/50 ring-2 ring-sky-300 dark:border-sky-400 dark:bg-sky-950/30 dark:ring-sky-800"
                        : isPast
                          ? "border-slate-200 bg-slate-50/70 text-slate-400 dark:border-white/5 dark:bg-white/3 dark:text-slate-500"
                          : "border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">
                          0{idx + 1}
                        </span>
                        {isCurrent && (
                          <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
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
                        {TERM_SCHEDULING_PHASE_LABELS[stepPhase]}
                      </span>

                      {deadlineField && (
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                          Due: {new Date(deadlineField).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>

                    {isPast && (
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
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
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

          {/* Card 2: Deadlines Form */}
          <Card className="p-6">
            <div className="border-b border-slate-100 pb-3 dark:border-white/5">
              <h2 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">Deadlines Control</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                The college calendar owns two deadlines for external stakeholders (Deans and Instructors). Extending a lapsed deadline reopens that phase for all departments.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Input
                  id="majors-due"
                  label="1. Major Scheduling Deadline (Deans)"
                  type="datetime-local"
                  value={majorsDueAtInput}
                  onChange={(e) => setMajorsDueAtInput(e.target.value)}
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
                <Input
                  id="suggestions-due"
                  label="2. Suggestions Window Deadline (Instructors)"
                  type="datetime-local"
                  value={suggestionsDueAtInput}
                  onChange={(e) => setSuggestionsDueAtInput(e.target.value)}
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

          {/* Card 4: Department Schedules & Readiness */}
          <Card className="p-6">
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
          <Card className="p-6">
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
          <Card className="p-6">
            <h2 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
              Term Stage Controls
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Move the term forward or step back to the previous phase when adjustments are needed.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {phaseData.phase === "major_scheduling" && (
                <Button
                  type="button"
                  block={false}
                  isLoading={actionLoading}
                  onClick={() => handleAdvancePhase("close_majors")}
                >
                  Close Majors &amp; Start Generation
                </Button>
              )}

              {phaseData.phase === "generation" && (
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
                    Distribute Term Schedules
                  </Button>
                </>
              )}

              {phaseData.phase === "suggestion_window" && (
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
                    isLoading={actionLoading}
                    onClick={() => handleAdvancePhase("resolve")}
                  >
                    Close Window &amp; Resolve Suggestions
                  </Button>
                </>
              )}

              {phaseData.phase === "resolution" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    disabled={actionLoading}
                    isLoading={actionLoading}
                    onClick={handleRewindPhase}
                  >
                    ← Reopen Suggestion Window
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    isLoading={actionLoading}
                    onClick={() => handleAdvancePhase("forward_for_approval")}
                  >
                    Forward Resolved Sets to Deans for Approval
                  </Button>
                  <Button
                    type="button"
                    block={false}
                    isLoading={actionLoading}
                    onClick={() => handleAdvancePhase("finalize")}
                  >
                    Finalize &amp; Publish Term
                  </Button>
                </>
              )}

              {phaseData.phase === "finalized" && (
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="emerald">
                    ✓ Term Finalized &amp; Published to All Users
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    disabled={actionLoading}
                    isLoading={actionLoading}
                    onClick={handleRewindPhase}
                  >
                    ← Step Back to Resolution
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : null}

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
