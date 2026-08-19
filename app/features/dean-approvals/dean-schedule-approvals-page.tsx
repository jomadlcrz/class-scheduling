import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/feedback/empty-state";
import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ScheduleApproveDialog } from "~/features/dean-approvals/schedule-approve-dialog";
import { ScheduleRejectDialog } from "~/features/dean-approvals/schedule-reject-dialog";
import {
  GroupedPendingApprovals,
  ScheduleRecentlyReviewedTable,
} from "~/features/dean-approvals/schedule-approvals-table";
import { useDeanScheduleApprovals } from "~/features/dean-approvals/use-dean-schedule-approvals";
import { SchedulePreviewModal } from "~/features/schedules/schedule-preview-modal";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import type { ScheduleRelease } from "~/types/schedule-release";

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

  const [previewTarget, setPreviewTarget] = useState<ScheduleRelease | null>(null);
  const [sendTarget, setSendTarget] = useState<ScheduleRelease | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ScheduleRelease | null>(null);
  const [sendCohort, setSendCohort] = useState<{ label: string; releases: ScheduleRelease[] } | null>(null);

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
      // Already reviewed / term closed: clear the stale row, then re-surface the backend message.
      await refresh().catch(() => {});
      throw err instanceof Error ? err : new Error("Unable to send the schedule to instructors.");
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

  /**
   * Approve every section in a Program→Year cohort. No atomic batch endpoint exists, so
   * approve sequentially and keep going on failure — then summarise the outcome once, since
   * one toast per section would drown the dean. Refresh reconciles whatever actually landed.
   */
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

  const pending = inbox?.pending ?? [];
  const recentlyReviewed = inbox?.recentlyReviewed ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Schedule Approvals"

      />

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
              <SelectValue />
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
              <SelectValue />
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
              <h2 id="pending-heading" className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
                Pending review
                <span className="ml-1.5 font-body text-sm font-normal text-slate-400 dark:text-slate-500">
                  ({pending.length})
                </span>
              </h2>
              <div className="mt-3">
                {pending.length === 0 ? (
                  <EmptyState title="No section schedules waiting for approval this term">
                    When the registrar submits a section timetable for this term, it will appear here — you'll
                    also get a notification.
                  </EmptyState>
                ) : (
                  <GroupedPendingApprovals
                    releases={pending}
                    programInfo={programInfo}
                    onPreview={setPreviewTarget}
                    onSendToInstructors={setSendTarget}
                    onReject={setRejectTarget}
                    onSendCohort={(label, releases) => setSendCohort({ label, releases })}
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
                  Recently reviewed
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

      <ConfirmDialog
        open={sendCohort !== null}
        onClose={() => setSendCohort(null)}
        title={`Send all of ${sendCohort?.label ?? ""} to instructors?`}
        confirmLabel={`Send ${sendCohort?.releases.length ?? 0} section${sendCohort?.releases.length === 1 ? "" : "s"}`}
        loadingLabel="Sending…"
        onConfirm={handleSendCohort}
      >
        This asks each assigned instructor to review their section timetable. It does not publish schedules;
        publication happens only after every instructor accepts and the dean gives final approval.
      </ConfirmDialog>
    </div>
  );
}
