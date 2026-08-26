import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldChrome, Input } from "~/components/ui/input";
import { ConfirmDialog, Modal, ModalActions } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { PhaseBanner } from "~/features/academic-terms/phase-banner";
import { ScheduleApproveDialog } from "~/features/dean-approvals/schedule-approve-dialog";
import { ScheduleRejectDialog } from "~/features/dean-approvals/schedule-reject-dialog";
import {
  GroupedPendingApprovals,
  SchedulePendingApprovalsTable,
  ScheduleRecentlyReviewedTable,
} from "~/features/dean-approvals/schedule-approvals-table";
import { useDeanScheduleApprovals } from "~/features/dean-approvals/use-dean-schedule-approvals";
import { SchedulePreviewModal } from "~/features/schedules/schedule-preview-modal";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import type { ScheduleRelease, ScheduleReleaseStatus } from "~/types/schedule-release";

type StageKey = "all" | ScheduleReleaseStatus;

const STAGE_LABELS: Record<ScheduleReleaseStatus, string> = {
  draft: "Draft",
  pending_dean_review: "Pending Review",
  instructor_review: "With Instructors",
  registrar_revision: "Under Revision",
  pending_final_approval: "Final Approval",
  approved: "Approved & Signed",
  rejected: "Returned",
};

const STAGES_ORDER: ScheduleReleaseStatus[] = [
  "pending_dean_review",
  "instructor_review",
  "registrar_revision",
  "pending_final_approval",
  "approved",
  "rejected",
];

export function DeanScheduleApprovalsPage() {
  const {
    isLoading,
    loadError,
    termsLoading,
    semestersLoading,
    schoolYears,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    semesters,
    semesterLabel,
    selectedSemesterNumber,
    setSelectedSemesterNumber,
    inbox,
    refresh,
  } = useDeanScheduleApprovals();

  const [activeStage, setActiveStage] = useState<StageKey>("pending_dean_review");

  const [previewTarget, setPreviewTarget] = useState<ScheduleRelease | null>(null);
  const [sendTarget, setSendTarget] = useState<ScheduleRelease | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ScheduleRelease | null>(null);
  const [sendCohort, setSendCohort] = useState<{ label: string; releases: ScheduleRelease[] } | null>(null);

  // Program-level actions
  const [sendProgramTarget, setSendProgramTarget] = useState<{ programId: number; programAbbrev: string } | null>(null);
  const [rejectProgramTarget, setRejectProgramTarget] = useState<{ programId: number; programAbbrev: string } | null>(null);
  const [rejectProgramReason, setRejectProgramReason] = useState("");
  const [returnRevisionTarget, setReturnRevisionTarget] = useState<{ programId: number; programAbbrev: string } | null>(null);
  const [returnRevisionReason, setReturnRevisionReason] = useState("");
  const [finalApproveTarget, setFinalApproveTarget] = useState<{ syId: number; semesterNumber: number; programId: number; programAbbrev: string } | null>(null);
  const [finalApproveConfirm, setFinalApproveConfirm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const contextReady = Boolean(selectedSchoolYearId && selectedSemesterNumber);

  const { data: programsData } = useCachedData("programs", () => programService.list());
  const programInfo = useMemo(() => {
    const map = new Map<string, { name: string; departmentCode: string }>();
    for (const p of programsData ?? []) {
      map.set(p.abbrev, { name: p.name, departmentCode: p.departmentAbbrev ?? "" });
    }
    return map;
  }, [programsData]);

  async function handleSendToInstructors() {
    if (!sendTarget) return;
    try {
      const { message } = await scheduleReleaseService.sendToInstructors(sendTarget.id);
      if (message) toast.success(message);
      await refresh();
      setSendTarget(null);
    } catch (err) {
      await refresh().catch(() => {});
      throw err instanceof Error ? err : new Error("Unable to send the schedule to instructors.");
    }
  }

  async function handleFinalApprove() {
    if (!finalApproveTarget) return;
    const expectedConfirmation = `Publish ${finalApproveTarget.programAbbrev} Official Schedules`;
    if (finalApproveConfirm.trim() !== expectedConfirmation) {
      toast.error(`Type "${expectedConfirmation}" exactly to confirm.`);
      return;
    }
    setActionLoading(true);
    try {
      const { message } = await scheduleReleaseService.finalApproveProgram(
        finalApproveTarget.syId,
        finalApproveTarget.semesterNumber,
        finalApproveTarget.programId,
        finalApproveConfirm.trim(),
      );
      if (message) toast.success(message);
      await refresh();
      setFinalApproveTarget(null);
      setFinalApproveConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sign and approve schedule.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(reason: string) {
    if (!rejectTarget) return;
    try {
      const { message } = await scheduleReleaseService.rejectRelease(rejectTarget.id, reason);
      if (message) toast.success(message);
      await refresh();
      setRejectTarget(null);
    } catch (err) {
      await refresh().catch(() => {});
      throw err instanceof Error ? err : new Error("Unable to reject the schedule.");
    }
  }

  async function handleSendCohort() {
    if (!sendCohort) return;
    const { releases } = sendCohort;
    let sent = 0;
    const failed: string[] = [];
    for (const release of releases) {
      try {
        await scheduleReleaseService.sendToInstructors(release.id);
        sent += 1;
      } catch {
        failed.push(`${release.programAbbrev ?? ""} ${release.setCode ?? ""}`.trim() || `#${release.id}`);
      }
    }
    if (sent > 0) toast.success(`Sent ${sent} section${sent === 1 ? "" : "s"} to instructors for review.`);
    if (failed.length > 0) {
      toast.error(`Couldn't send ${failed.length}: ${failed.join(", ")}. They may already be reviewed.`);
    }
    await refresh().catch(() => {});
    setSendCohort(null);
  }

  async function handleSendProgramSubmit() {
    if (!sendProgramTarget || !selectedSchoolYearId || !selectedSemesterNumber) return;
    setActionLoading(true);
    try {
      const res = await scheduleReleaseService.sendProgramToInstructors(
        Number(selectedSchoolYearId),
        Number(selectedSemesterNumber),
        sendProgramTarget.programId,
      );
      toast.success(res.message);
      if (res.blocked && res.blocked.length > 0) {
        toast.warning(
          `Some sections could not be sent: ${res.blocked.map((b) => `${b.setCode} (${b.reason})`).join(", ")}`,
        );
      }
      setSendProgramTarget(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send program schedules.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectProgramSubmit() {
    if (!rejectProgramTarget || !selectedSchoolYearId || !selectedSemesterNumber) return;
    if (rejectProgramReason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await scheduleReleaseService.rejectProgram(
        Number(selectedSchoolYearId),
        Number(selectedSemesterNumber),
        rejectProgramTarget.programId,
        rejectProgramReason.trim(),
      );
      toast.success(res.message);
      setRejectProgramTarget(null);
      setRejectProgramReason("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to return program schedules.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReturnForRevisionSubmit() {
    if (!returnRevisionTarget || !selectedSchoolYearId || !selectedSemesterNumber) return;
    if (returnRevisionReason.trim().length < 10) {
      toast.error("Revision reason must be at least 10 characters.");
      return;
    }
    setActionLoading(true);
    try {
      const result = await scheduleReleaseService.returnProgramForRevision(
        Number(selectedSchoolYearId),
        Number(selectedSemesterNumber),
        returnRevisionTarget.programId,
        returnRevisionReason.trim(),
      );
      toast.success(result.message);
      setReturnRevisionTarget(null);
      setReturnRevisionReason("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to return the program for revision.");
    } finally {
      setActionLoading(false);
    }
  }

  const allPending = inbox?.pending ?? [];
  const recentlyReviewed = inbox?.recentlyReviewed ?? [];
  const initialReviewReleases = useMemo(
    () => allPending.filter((release) => release.releaseStatus === "pending_dean_review"),
    [allPending],
  );

  // Filter items based on active stage
  const pendingForStage = useMemo(() => {
    if (activeStage === "all") return allPending;
    if (activeStage === "pending_dean_review") return allPending.filter((r) => r.releaseStatus === "pending_dean_review");
    if (activeStage === "pending_final_approval") return allPending.filter((r) => r.releaseStatus === "pending_final_approval");
    return allPending.filter((r) => r.releaseStatus === activeStage);
  }, [allPending, activeStage]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader title="Schedule Approvals" />

      {/* Phase Banner */}
      <div className="mt-4">
        <PhaseBanner
          syId={selectedSchoolYearId ? Number(selectedSchoolYearId) : null}
          semesterNumber={selectedSemesterNumber ? Number(selectedSemesterNumber) : null}
          role="dean"
        />
      </div>

      <Card className="mt-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <FieldChrome id="da-school-year" label="School Year">
          <Select
            items={
              termsLoading
                ? [{ value: "", label: "Loading…" }]
                : schoolYears.length === 0
                  ? [{ value: "", label: "No school year" }]
                  : schoolYears.map((y) => ({ value: String(y.id), label: y.schoolYear }))
            }
            value={selectedSchoolYearId}
            onValueChange={(v) => setSelectedSchoolYearId(v as string)}
          >
            <SelectTrigger id="da-school-year">
              <SelectValue placeholder="Select school year" />
            </SelectTrigger>
            <SelectContent>
              {termsLoading ? (
                <SelectItem value="">Loading…</SelectItem>
              ) : schoolYears.length === 0 ? (
                <SelectItem value="">No school year</SelectItem>
              ) : (
                schoolYears.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>
                    {y.schoolYear}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </FieldChrome>
        <FieldChrome id="da-semester" label="Semester">
          <Select
            items={
              semestersLoading
                ? [{ value: "", label: "Loading…" }]
                : semesters.length === 0
                  ? [{ value: "", label: "No semester" }]
                  : semesters
                      .filter((s) => s.semesterNumber !== 3)
                      .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))
            }
            value={selectedSemesterNumber}
            onValueChange={(v) => setSelectedSemesterNumber(v as string)}
          >
            <SelectTrigger id="da-semester">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {semestersLoading ? (
                <SelectItem value="">Loading…</SelectItem>
              ) : semesters.length === 0 ? (
                <SelectItem value="">No semester</SelectItem>
              ) : (
                semesters
                  .filter((s) => s.semesterNumber !== 3)
                  .map((s) => (
                    <SelectItem key={s.id} value={String(s.semesterNumber)}>
                      {semesterLabel(s.semesterNumber)}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </FieldChrome>
      </Card>

      {/* Stage Tracker Navigation */}
      {inbox?.stageCounts && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STAGES_ORDER.map((stage) => {
            const count = inbox.stageCounts?.[stage] ?? 0;
            const isSelected = activeStage === stage;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setActiveStage(stage)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "border-sky-500 bg-sky-50 text-sky-900 shadow-xs ring-2 ring-sky-300 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-navy-900 dark:text-mist-200 dark:hover:bg-white/5"
                }`}
              >
                <span>{STAGE_LABELS[stage]}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums ${
                    count > 0
                      ? isSelected
                        ? "bg-sky-600 text-white"
                        : "bg-slate-200 text-slate-700 dark:bg-navy-800 dark:text-mist-100"
                      : "bg-transparent text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        {loadError ? (
          <EmptyState title="Couldn't load schedule approvals">{loadError}</EmptyState>
        ) : !contextReady || isLoading ? (
          <div role="status" aria-label="Loading schedule approvals" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <section aria-labelledby="pending-heading">
              <h2 id="pending-heading" className="text-base font-semibold text-navy-800 dark:text-mist-100">
                {activeStage === "all" ? "All Schedules" : STAGE_LABELS[activeStage as ScheduleReleaseStatus] ?? "Pending review"}
                <span className="ml-1.5 font-normal text-sm text-slate-400 dark:text-slate-500">
                  ({pendingForStage.length})
                </span>
              </h2>
              {activeStage === "pending_dean_review" && initialReviewReleases.length > 0 && (
                <Card className="mt-3 flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50/60 p-4 dark:border-gold-400/25 dark:bg-gold-400/8">
                  <div>
                    <p className="font-semibold text-navy-800 dark:text-mist-100">Initial Dean review required</p>
                    <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                      Send these {initialReviewReleases.length} section schedule{initialReviewReleases.length === 1 ? "" : "s"} to their assigned instructors. This is the required first Dean action; final signing happens only after the term&apos;s shift requests are resolved.
                    </p>
                  </div>
                  <Button
                    type="button"
                    block={false}
                    onClick={() => setSendCohort({ label: "this term", releases: initialReviewReleases })}
                  >
                    Send all to instructors ({initialReviewReleases.length})
                  </Button>
                </Card>
              )}
              <div className="mt-3">
                {pendingForStage.length === 0 ? (
                  <EmptyState title="No section schedules in this stage">
                    {activeStage === "pending_dean_review"
                      ? "When the registrar submits a section timetable for this term, it will appear here."
                      : "No sections currently match this stage."}
                  </EmptyState>
                ) : activeStage === "pending_dean_review" ? (
                  <GroupedPendingApprovals
                    releases={pendingForStage}
                    programInfo={programInfo}
                    onPreview={setPreviewTarget}
                    onSendToInstructors={setSendTarget}
                    onReject={setRejectTarget}
                    onFinalApprove={(release) => {
                      setFinalApproveTarget({ syId: release.syId, semesterNumber: release.semesterNumber, programId: release.programId, programAbbrev: release.programAbbrev ?? "" });
                      setFinalApproveConfirm("");
                    }}
                    onSendCohort={(label, releases) => setSendCohort({ label, releases })}
                    onSendProgram={(programId, programAbbrev) => setSendProgramTarget({ programId, programAbbrev })}
                    onRejectProgram={(programId, programAbbrev) => setRejectProgramTarget({ programId, programAbbrev })}
                  />
                ) : (
                  <SchedulePendingApprovalsTable
                    releases={pendingForStage}
                    onPreview={setPreviewTarget}
                    onFinalApprove={(release) => {
                      setFinalApproveTarget({ syId: release.syId, semesterNumber: release.semesterNumber, programId: release.programId, programAbbrev: release.programAbbrev ?? "" });
                      setFinalApproveConfirm("");
                    }}
                    onReturnForRevision={(release) => {
                      setReturnRevisionTarget({ programId: release.programId, programAbbrev: release.programAbbrev ?? "" });
                      setReturnRevisionReason("");
                    }}
                  />
                )}
              </div>
            </section>

            {recentlyReviewed.length > 0 && (
              <section aria-labelledby="reviewed-heading">
                <h2
                  id="reviewed-heading"
                  className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100"
                >
                  Recently reviewed &amp; signed
                </h2>
                <div className="mt-3">
                  <ScheduleRecentlyReviewedTable releases={recentlyReviewed} />
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <SchedulePreviewModal
        open={previewTarget !== null}
        releaseId={previewTarget?.id ?? null}
        fetchPreview={scheduleReleaseService.getApprovalPreview}
        onClose={() => setPreviewTarget(null)}
      />

      <ScheduleApproveDialog
        open={sendTarget !== null}
        release={sendTarget}
        onClose={() => setSendTarget(null)}
        onConfirm={handleSendToInstructors}
      />

      <ScheduleRejectDialog
        open={rejectTarget !== null}
        release={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />

      <Modal
        open={finalApproveTarget !== null}
        onClose={() => {
          setFinalApproveTarget(null);
          setFinalApproveConfirm("");
        }}
        title={`Publish ${finalApproveTarget?.programAbbrev ?? ""} Official Schedules?`}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This signs every section of {finalApproveTarget?.programAbbrev ?? "this program"} that is waiting for final approval. It cannot be undone. The term becomes public once every required program is signed and the Registrar finalizes the term.
        </p>
        <label className="mt-4 block text-sm font-medium text-navy-800 dark:text-mist-100">
          Type <span className="font-semibold">Publish {finalApproveTarget?.programAbbrev} Official Schedules</span> to confirm
          <input
            value={finalApproveConfirm}
            onChange={(event) => setFinalApproveConfirm(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-navy-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100"
            autoComplete="off"
          />
        </label>
        <ModalActions>
          <Button type="button" variant="outline" block={false} disabled={actionLoading} onClick={() => setFinalApproveTarget(null)}>Cancel</Button>
          <Button type="button" block={false} disabled={finalApproveConfirm.trim() !== `Publish ${finalApproveTarget?.programAbbrev ?? ""} Official Schedules` || actionLoading} isLoading={actionLoading} onClick={handleFinalApprove}>
            Sign &amp; Final Approve Program
          </Button>
        </ModalActions>
      </Modal>

      <Modal
        open={returnRevisionTarget !== null}
        onClose={() => {
          setReturnRevisionTarget(null);
          setReturnRevisionReason("");
        }}
        title={`Return ${returnRevisionTarget?.programAbbrev ?? ""} for Registrar Revision`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This moves the program from final Dean approval back to Registrar Revision. It does not use the initial-review rejection path.
          </p>
          <Textarea
            id="return-revision-reason"
            label="Required revision reason"
            value={returnRevisionReason}
            onChange={(event) => setReturnRevisionReason(event.target.value)}
          />
          <p className="text-right text-xs text-slate-400">{returnRevisionReason.trim().length} / 10 characters minimum</p>
          <ModalActions>
            <Button type="button" variant="outline" block={false} disabled={actionLoading} onClick={() => setReturnRevisionTarget(null)}>Cancel</Button>
            <Button type="button" variant="danger" block={false} isLoading={actionLoading} disabled={returnRevisionReason.trim().length < 10} onClick={handleReturnForRevisionSubmit}>
              Return for Revision
            </Button>
          </ModalActions>
        </div>
      </Modal>

      <ConfirmDialog
        open={sendCohort !== null}
        onClose={() => setSendCohort(null)}
        title={`Send all of ${sendCohort?.label ?? ""} to instructors?`}
        confirmLabel={`Send ${sendCohort?.releases.length ?? 0} section${sendCohort?.releases.length === 1 ? "" : "s"}`}
        loadingLabel="Sending…"
        onConfirm={handleSendCohort}
      >
        This asks each assigned instructor to review their section timetable. It does not publish schedules;
        publication happens only after every instructor accepts, the dean gives final approval, and the
        Registrar finalizes the complete term.
      </ConfirmDialog>

      {/* Program-Level Send Confirmation */}
      <ConfirmDialog
        open={sendProgramTarget !== null}
        onClose={() => setSendProgramTarget(null)}
        title={`Send all sections of ${sendProgramTarget?.programAbbrev ?? ""} to instructors?`}
        confirmLabel="Send Program to Instructors"
        loadingLabel="Sending…"
        onConfirm={handleSendProgramSubmit}
      >
        This sends all sections under {sendProgramTarget?.programAbbrev} to instructors in one atomic action.
      </ConfirmDialog>

      {/* Program-Level Reject Dialog */}
      <Modal
        open={rejectProgramTarget !== null}
        onClose={() => setRejectProgramTarget(null)}
        title={`Return ${rejectProgramTarget?.programAbbrev ?? ""} to Registrar`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explain what needs to be changed across the {rejectProgramTarget?.programAbbrev} schedule. The registrar will be notified with your feedback.
          </p>
          <Textarea
            id="prog-reject-reason"
            label="Feedback for the registrar"
            value={rejectProgramReason}
            onChange={(e) => setRejectProgramReason(e.target.value)}
          />
          <p className="text-right text-xs text-slate-400">
            {rejectProgramReason.trim().length} / 10 characters minimum
          </p>
          <ModalActions>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => {
                setRejectProgramTarget(null);
                setRejectProgramReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              block={false}
              isLoading={actionLoading}
              disabled={rejectProgramReason.trim().length < 10}
              onClick={handleRejectProgramSubmit}
            >
              Return Program to Registrar
            </Button>
          </ModalActions>
        </div>
      </Modal>
    </div>
  );
}
