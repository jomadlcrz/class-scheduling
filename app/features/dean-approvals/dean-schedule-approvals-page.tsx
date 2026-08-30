import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/feedback/empty-state";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { AlertIcon, ChevronRightIcon, SendIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { PhaseBanner } from "~/features/academic-terms/phase-banner";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
  StatusBadge,
} from "~/features/academic-terms/status-badges";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { ScheduleLifecycleRail } from "~/features/schedules/schedule-lifecycle-rail";
import { SchedulePreviewModal } from "~/features/schedules/schedule-preview-modal";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import { PageHeader } from "~/layouts/page-header";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import type { DeanProgramApprovalItem, DeanProgramApprovalStage, ScheduleRelease } from "~/types/schedule-release";

const MIN_REASON = 10;
const MAX_REASON = 2000;

const STAGE_TONES: Record<DeanProgramApprovalStage, BadgeTone> = {
  returned: "red",
  waiting: "gold",
  with_instructors: "sky",
  with_registrar: "violet",
  final_approval: "navy",
  final_approval_complete: "violet",
  published: "emerald",
};

function approvalConfirmationPhrase(programAbbrev: string | null): string {
  return `Approve ${(programAbbrev ?? "").trim()} Final Schedules`;
}

function SetRow({
  release,
  programStatus,
  onPreview,
}: {
  release: ScheduleRelease;
  programStatus: string | null;
  onPreview: (release: ScheduleRelease) => void;
}) {
  const label = [release.programAbbrev, release.yearLevel].filter(Boolean).join("-");
  const outOfStep = programStatus !== null && release.releaseStatus !== programStatus;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-navy-900">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">
          {label}
          {release.setCode}
        </span>
        <Badge tone="slate">
          {release.sessionCount} session{release.sessionCount === 1 ? "" : "s"}
        </Badge>
        {outOfStep && (
          <StatusBadge tone={scheduleReleaseStatusTone(release.releaseStatus)}>
            {scheduleReleaseStatusLabel(release.releaseStatus)}
          </StatusBadge>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        block={false}
        className="text-xs"
        onClick={() => onPreview(release)}
      >
        View Timetable
      </Button>
    </div>
  );
}

function ProgramCard({
  group,
  onAccept,
  onApproveFinal,
  onReturn,
  onReturnForRevision,
  onPreview,
  busy,
  yearLevelLabel,
}: {
  group: DeanProgramApprovalItem;
  onAccept: (group: DeanProgramApprovalItem) => void;
  onApproveFinal: (group: DeanProgramApprovalItem) => void;
  onReturn: (group: DeanProgramApprovalItem) => void;
  onReturnForRevision: (group: DeanProgramApprovalItem) => void;
  onPreview: (release: ScheduleRelease) => void;
  busy: boolean;
  yearLevelLabel: (n: number) => string;
}) {
  const [open, setOpen] = useState(group.pendingCount > 0 || group.awaitingFinalCount > 0);
  const rail = group.representative;
  const waiting = group.pendingCount;
  const awaitingFinal = group.awaitingFinalCount;

  const years = useMemo(() => {
    const byYear = new Map<number, ScheduleRelease[]>();
    for (const release of group.sections) {
      const key = release.yearLevel ?? 0;
      byYear.set(key, [...(byYear.get(key) ?? []), release]);
    }
    return [...byYear.entries()].sort(([a], [b]) => a - b);
  }, [group.sections]);

  const breakdown = useMemo(() => {
    const total = group.sections.length;
    const sentToInstructors = group.sections.filter(
      (r) =>
        r.releaseStatus !== "draft" &&
        r.releaseStatus !== "pending_dean_review" &&
        r.releaseStatus !== "rejected",
    ).length;
    return { total, sentToInstructors };
  }, [group.sections]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-white/10">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        >
          <span
            aria-hidden="true"
            className={`shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
          >
            <ChevronRightIcon />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                {group.programAbbrev}
              </span>
              {group.programName ? (
                <span className="font-body text-sm text-slate-500 dark:text-slate-400">
                  — {group.programName}
                </span>
              ) : null}
              <Badge tone={STAGE_TONES[group.stage] ?? "slate"}>
                {group.stageLabel}
              </Badge>
            </div>
            <div className="mt-0.5 block font-body text-xs text-slate-500 dark:text-slate-400">
              <span className="uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Sets:{" "}
              </span>
              {group.sectionCount} · {group.sessionCount} sessions
              {waiting > 0 ? (
                <>
                  {" · "}
                  {breakdown.sentToInstructors}/{breakdown.total} sent to instructors, {waiting}{" "}
                  still awaiting Initial Review
                </>
              ) : null}
            </div>
          </div>
        </button>

        {waiting > 0 ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={busy}
              onClick={() => onReturn(group)}
            >
              Return to registrar
            </Button>
            <Button
              type="button"
              block={false}
              disabled={busy}
              isLoading={busy}
              loadingLabel="Sending…"
              onClick={() => onAccept(group)}
            >
              <SendIcon />
              Send to instructors
            </Button>
          </div>
        ) : awaitingFinal > 0 ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={busy}
              onClick={() => onReturnForRevision(group)}
            >
              Return for Revision
            </Button>
            <Button
              type="button"
              block={false}
              disabled={busy}
              isLoading={busy}
              loadingLabel="Approving…"
              onClick={() => onApproveFinal(group)}
            >
              Final Approve
            </Button>
          </div>
        ) : null}
      </div>

      {open && (
        <div className="p-4">
          {rail && (
            <div className="pb-4">
              <ScheduleLifecycleRail release={rail} audience="dean" />
            </div>
          )}

          <div className="flex flex-col gap-4">
            {years.map(([yearLevel, rows]) => (
              <section key={yearLevel} className="flex flex-col gap-2">
                <h3 className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                  {yearLevelLabel(yearLevel || 1)}
                  <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                    ({rows.length} set{rows.length === 1 ? "" : "s"})
                  </span>
                </h3>
                <div className="flex flex-col gap-1.5">
                  {rows.map((release) => (
                    <SetRow
                      key={release.id}
                      release={release}
                      programStatus={rail?.releaseStatus ?? null}
                      onPreview={onPreview}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function DeanScheduleApprovalsPage() {
  const { context: termContext, selectTerm } = useTermContext();
  const { schoolYears, defaultSchoolYear, loading: schoolYearsLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();
  const { yearLevelLabel } = useYearLevels();

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string>("");
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState<string>("");

  const [groups, setGroups] = useState<DeanProgramApprovalItem[]>([]);
  const [waiting, setWaiting] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [previewTarget, setPreviewTarget] = useState<ScheduleRelease | null>(null);
  const [acceptTarget, setAcceptTarget] = useState<DeanProgramApprovalItem | null>(null);
  const [sendAllTarget, setSendAllTarget] = useState(false);
  const [finalTarget, setFinalTarget] = useState<DeanProgramApprovalItem | null>(null);
  const [returnTarget, setReturnTarget] = useState<DeanProgramApprovalItem | null>(null);
  const [returnFinalTarget, setReturnFinalTarget] = useState<DeanProgramApprovalItem | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (selectedSchoolYearId || schoolYears.length === 0) return;
    if (termContext?.selection.syId) {
      setSelectedSchoolYearId(String(termContext.selection.syId));
      setSelectedSemesterNumber(String(termContext.selection.semesterNumber));
      return;
    }
    const match = schoolYears.find((s) => s.schoolYear === defaultSchoolYear) ?? schoolYears[0];
    if (match) setSelectedSchoolYearId(String(match.id));
  }, [schoolYears, defaultSchoolYear, selectedSchoolYearId, termContext]);

  useEffect(() => {
    if (selectedSemesterNumber || semesters.length === 0) return;
    if (termContext?.selection.semesterNumber) {
      setSelectedSemesterNumber(String(termContext.selection.semesterNumber));
      return;
    }
    const first = semesters.find((s) => s.semesterNumber !== 3) ?? semesters[0];
    if (first) setSelectedSemesterNumber(String(first.semesterNumber));
  }, [semesters, selectedSemesterNumber, termContext]);

  const load = useCallback(async () => {
    if (!selectedSchoolYearId || !selectedSemesterNumber) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await scheduleReleaseService.listProgramApprovals(
        Number(selectedSchoolYearId),
        Number(selectedSemesterNumber),
      );
      setGroups(data.programs ?? []);
      setWaiting(data.waitingCount ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not load program schedules.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedSchoolYearId, selectedSemesterNumber]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccept() {
    if (!acceptTarget || !selectedSchoolYearId || !selectedSemesterNumber) return;
    setBusyId(acceptTarget.programId);
    try {
      const result = await scheduleReleaseService.sendProgramToInstructors(
        Number(selectedSchoolYearId),
        Number(selectedSemesterNumber),
        acceptTarget.programId,
      );
      if (result.message) toast.success(result.message);
      for (const row of result.blocked ?? []) {
        toast.error(`Set ${row.setCode || row.setId} stayed with you — ${row.reason}`);
      }
      setAcceptTarget(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send this program to instructors.";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSendAll() {
    if (!selectedSchoolYearId || !selectedSemesterNumber) return;
    setActionLoading(true);
    try {
      const result = await scheduleReleaseService.sendAllToInstructors(
        Number(selectedSchoolYearId),
        Number(selectedSemesterNumber),
      );
      if (result.message) toast.success(result.message);
      for (const row of result.blocked ?? []) {
        toast.error(`Set ${row.setCode || row.setId} stayed with you — ${row.reason}`);
      }
      setSendAllTarget(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send all programs to instructors.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApproveFinal() {
    if (!finalTarget || !selectedSchoolYearId || !selectedSemesterNumber) return;
    setBusyId(finalTarget.programId);
    try {
      const phrase = approvalConfirmationPhrase(finalTarget.programAbbrev);
      const result = await scheduleReleaseService.finalApproveProgram(
        Number(selectedSchoolYearId),
        Number(selectedSemesterNumber),
        finalTarget.programId,
        phrase,
      );
      if (result.message) toast.success(result.message);
      for (const row of (result.blocked as { setId?: number; reason?: string }[]) ?? []) {
        toast.error(`Set ${row.setId} stayed with you — ${row.reason}`);
      }
      setFinalTarget(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not approve this program.";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReturn() {
    if (!returnTarget || !selectedSchoolYearId || !selectedSemesterNumber) return;
    setBusyId(returnTarget.programId);
    try {
      const result = await scheduleReleaseService.rejectProgram(
        Number(selectedSchoolYearId),
        Number(selectedSemesterNumber),
        returnTarget.programId,
        reason.trim(),
      );
      if (result.message) toast.success(result.message);
      setReturnTarget(null);
      setReason("");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not return this program to registrar.";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReturnForRevision() {
    if (!returnFinalTarget || !selectedSchoolYearId || !selectedSemesterNumber) return;
    setBusyId(returnFinalTarget.programId);
    try {
      const result = await scheduleReleaseService.returnProgramForRevision(
        Number(selectedSchoolYearId),
        Number(selectedSemesterNumber),
        returnFinalTarget.programId,
        reason.trim(),
      );
      if (result.message) toast.success(result.message);
      setReturnFinalTarget(null);
      setReason("");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not return this program for revision.";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  const syNumber = selectedSchoolYearId ? Number(selectedSchoolYearId) : null;
  const semNumber = selectedSemesterNumber ? Number(selectedSemesterNumber) : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Schedule Approvals"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-40 sm:w-48">
              <Select
                items={
                  schoolYearsLoading
                    ? [{ value: "", label: "Loading…" }]
                    : schoolYears.map((y) => ({ value: String(y.id), label: y.schoolYear }))
                }
                value={selectedSchoolYearId}
                onValueChange={(val) => {
                  if (typeof val === "string") {
                    setSelectedSchoolYearId(val);
                    if (semNumber) selectTerm(Number(val), semNumber);
                  }
                }}
              >
                <SelectTrigger id="dean-sy-select">
                  <SelectValue placeholder="Select school year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.schoolYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36 sm:w-44">
              <Select
                items={
                  semestersLoading
                    ? [{ value: "", label: "Loading…" }]
                    : semesters
                        .filter((s) => s.semesterNumber !== 3)
                        .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))
                }
                value={selectedSemesterNumber}
                onValueChange={(val) => {
                  if (typeof val === "string") {
                    setSelectedSemesterNumber(val);
                    if (syNumber) selectTerm(syNumber, Number(val));
                  }
                }}
              >
                <SelectTrigger id="dean-sem-select">
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
            </div>
          </div>
        }
      />

      <div className="mt-4">
        <PhaseBanner syId={syNumber} semesterNumber={semNumber} role="dean" />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {loadError ? (
          <EmptyState title="Couldn't load schedule approvals">{loadError}</EmptyState>
        ) : loading ? (
          <div role="status" aria-label="Loading schedules" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState title="Nothing has been sent to you yet">
            Programs appear here once the Registrar distributes or submits schedules for your department.
          </EmptyState>
        ) : (
          <>
            {waiting > 0 && (
              <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50/60 p-4 dark:border-gold-400/25 dark:bg-gold-400/8">
                <div>
                  <p className="font-semibold text-navy-800 dark:text-mist-100">
                    Initial Dean Review Required
                  </p>
                  <p className="mt-0.5 font-body text-sm text-slate-600 dark:text-slate-300">
                    {waiting} section schedule{waiting === 1 ? "" : "s"} across{" "}
                    {groups.filter((g) => g.pendingCount > 0).length} program(s) waiting for you to
                    pass them to instructors.
                  </p>
                </div>
                <Button
                  type="button"
                  block={false}
                  disabled={actionLoading}
                  isLoading={actionLoading}
                  loadingLabel="Sending…"
                  onClick={() => setSendAllTarget(true)}
                >
                  <SendIcon />
                  Send all to instructors ({waiting})
                </Button>
              </Card>
            )}

            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <ProgramCard
                  key={group.programId}
                  group={group}
                  onAccept={setAcceptTarget}
                  onApproveFinal={setFinalTarget}
                  onReturn={(next) => {
                    setReason("");
                    setReturnTarget(next);
                  }}
                  onReturnForRevision={(next) => {
                    setReason("");
                    setReturnFinalTarget(next);
                  }}
                  onPreview={setPreviewTarget}
                  busy={busyId === group.programId}
                  yearLevelLabel={yearLevelLabel}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Schedule Preview Modal */}
      <SchedulePreviewModal
        open={previewTarget !== null}
        releaseId={previewTarget?.id ?? null}
        fetchPreview={scheduleReleaseService.getReleasePreview}
        onClose={() => setPreviewTarget(null)}
      />

      {/* Confirm Send Program to Instructors */}
      <ConfirmDialog
        open={acceptTarget !== null}
        onClose={() => setAcceptTarget(null)}
        title={`Send ${acceptTarget?.programAbbrev ?? ""} to its instructors`}
        confirmLabel="Send to instructors"
        loadingLabel="Sending…"
        onConfirm={handleAccept}
      >
        {acceptTarget
          ? `${acceptTarget.pendingCount} section schedule(s) in ${acceptTarget.programAbbrev} will be sent to their assigned instructors for review. Each instructor will see their teaching sessions and can accept or submit shift requests.`
          : null}
      </ConfirmDialog>

      {/* Confirm Send All to Instructors */}
      <ConfirmDialog
        open={sendAllTarget}
        onClose={() => setSendAllTarget(false)}
        title="Send all waiting schedules to instructors"
        confirmLabel="Send all to instructors"
        loadingLabel="Sending…"
        onConfirm={handleSendAll}
      >
        Send all {waiting} waiting section schedules across your department to their instructors?
        Instructors will be able to review their sessions and submit shift requests before the
        deadline.
      </ConfirmDialog>

      {/* Final Approval Confirm Dialog */}
      <ConfirmDialog
        open={finalTarget !== null}
        onClose={() => setFinalTarget(null)}
        title={`Approve ${finalTarget?.programAbbrev ?? ""} Final Schedules`}
        confirmLabel={`Approve ${finalTarget?.programAbbrev ?? ""}`}
        loadingLabel="Approving…"
        confirmVariant="primary"
        confirmationText={
          finalTarget ? approvalConfirmationPhrase(finalTarget.programAbbrev) : undefined
        }
        onConfirm={handleApproveFinal}
      >
        {finalTarget ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
              <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Signing off
              </p>
              <p className="mt-0.5 font-body text-base font-semibold text-navy-900 dark:text-mist-100">
                {finalTarget.awaitingFinalCount} section{finalTarget.awaitingFinalCount === 1 ? "" : "s"} · {finalTarget.programAbbrev}
              </p>
            </div>
            <Alert variant="destructive">
              <AlertIcon />
              <AlertTitle>This action is irreversible.</AlertTitle>
              <AlertDescription>
                {finalTarget.completesFinalApprovals
                  ? "Yours is the last department outstanding — once you approve, every department has signed off and the Registrar can publish the term schedule."
                  : "Approving is final. These schedules will reach students and instructors once all departments approve and the Registrar finalizes the term."}
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
      </ConfirmDialog>

      {/* Return Program to Registrar Dialog */}
      <ConfirmDialog
        open={returnTarget !== null}
        onClose={() => setReturnTarget(null)}
        title={`Return ${returnTarget?.programAbbrev ?? ""} to the Registrar`}
        confirmLabel="Return to Registrar"
        loadingLabel="Returning…"
        confirmDisabled={reason.trim().length < MIN_REASON || reason.trim().length > MAX_REASON}
        onConfirm={handleReturn}
      >
        {returnTarget ? (
          <div className="flex flex-col gap-3">
            <p className="font-body text-sm text-slate-600 dark:text-slate-300">
              {returnTarget.pendingCount} section schedule(s) in {returnTarget.programAbbrev} will
              return to the Registrar for correction. Your reason will be shown on every section.
            </p>
            <Textarea
              id="program-return-reason"
              label="What needs changing"
              required
              minLength={MIN_REASON}
              maxLength={MAX_REASON}
              hint={
                reason.trim().length < MIN_REASON
                  ? `Required — at least ${MIN_REASON} characters (${reason.trim().length}/${MIN_REASON}).`
                  : `${reason.trim().length}/${MAX_REASON} characters.`
              }
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Name what has to change before you can pass this on"
            />
          </div>
        ) : null}
      </ConfirmDialog>

      {/* Return for Revision Dialog */}
      <ConfirmDialog
        open={returnFinalTarget !== null}
        onClose={() => setReturnFinalTarget(null)}
        title={`Return ${returnFinalTarget?.programAbbrev ?? ""} for Revision`}
        confirmLabel="Return for Revision"
        loadingLabel="Returning…"
        confirmDisabled={reason.trim().length < MIN_REASON || reason.trim().length > MAX_REASON}
        onConfirm={handleReturnForRevision}
      >
        {returnFinalTarget ? (
          <div className="flex flex-col gap-3">
            <p className="font-body text-sm text-slate-600 dark:text-slate-300">
              {returnFinalTarget.awaitingFinalCount} section schedule(s) in{" "}
              {returnFinalTarget.programAbbrev} will return to the Registrar for revision. The
              Registrar will resolve your feedback and resubmit for your final approval.
            </p>
            <Textarea
              id="program-revision-reason"
              label="What needs changing"
              required
              minLength={MIN_REASON}
              maxLength={MAX_REASON}
              hint={
                reason.trim().length < MIN_REASON
                  ? `Required — at least ${MIN_REASON} characters (${reason.trim().length}/${MIN_REASON}).`
                  : `${reason.trim().length}/${MAX_REASON} characters.`
              }
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Name what still needs to change before you can give final approval"
            />
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
