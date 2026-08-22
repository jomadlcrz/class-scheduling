import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import { EmptyState } from "~/components/feedback/empty-state";
import { FormError } from "~/components/forms/form-error";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ClockIcon, EyeIcon, FlaskConicalIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog, Modal, ModalActions } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { formatTime12h, normalizeTime, timeToMinutes } from "~/lib/time";
import { authorityWorkflowService } from "~/services/authority-workflow.service";
import { deanService } from "~/services/dean.service";
import { programService } from "~/services/program.service";
import { scheduleService } from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import type { MajorSchedule, MajorScheduleAuditLogResult, MajorScheduleConflict, MajorScheduleEditRequest, MajorScheduleMeetingInput, MajorScheduleRequirements, MajorScheduleSubmission } from "~/types/authority-workflow";
import { DAY_LABELS, generateTimeSlots } from "~/types/schedule";

export function meta() {
  return [{ title: "Major Schedules — GWC Class Scheduling" }];
}

const STATUS_TONES: Record<string, BadgeTone> = {
  draft: "slate", reopened: "gold", submitted: "navy", finalized: "emerald",
  pending: "gold", approved: "emerald", rejected: "red",
};

const TIME_OPTIONS = generateTimeSlots().map(formatTime12h);

type DecisionTarget = { request: MajorScheduleEditRequest; approve: boolean };

function MajorSchedulesPage() {
  const { user } = useAuth();
  const { schoolYears } = useSchoolYears();
  const { semesters, semesterLabel } = useSemesters();
  const [syId, setSyId] = useState(0);
  const [semesterNumber, setSemesterNumber] = useState(0);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MajorSchedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MajorSchedule | null>(null);
  const [registrarDeleteTarget, setRegistrarDeleteTarget] = useState<MajorSchedule | null>(null);
  const [editRequestTarget, setEditRequestTarget] = useState<MajorScheduleSubmission | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null);
  const [conflicts, setConflicts] = useState<MajorScheduleConflict[] | null>(null);
  const [floatingTarget, setFloatingTarget] = useState<MajorSchedule | null>(null);
  const [reopenTarget, setReopenTarget] = useState<MajorScheduleSubmission | null>(null);
  const [submissionDetail, setSubmissionDetail] = useState<MajorScheduleSubmission | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<MajorScheduleRequirements | null>(null);
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [requirementsError, setRequirementsError] = useState<string | null>(null);
  const [floatingInstructorId, setFloatingInstructorId] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!syId && schoolYears.length) setSyId(schoolYears[0].id);
  }, [schoolYears, syId]);
  useEffect(() => {
    if (!semesterNumber && semesters.length) setSemesterNumber((semesters.find((row) => row.semesterNumber !== 3) ?? semesters[0]).semesterNumber);
  }, [semesterNumber, semesters]);

  const scopeReady = syId > 0 && semesterNumber > 0;
  const { data: submissions, error, reload } = useCachedData(
    `major-schedule-submissions:${syId}:${semesterNumber}`,
    () => authorityWorkflowService.listMajorScheduleSubmissions({ syId, semesterNumber }),
    { enabled: scopeReady, cache: false },
  );
  const { data: editRequests, reload: reloadEditRequests } = useCachedData(
    "major-schedule-edit-requests",
    () => authorityWorkflowService.listMajorScheduleEditRequests(),
    { enabled: user?.role === "registrar", cache: false },
  );
  const { data: labSlots } = useCachedData("major-schedule-lab-slots", () => authorityWorkflowService.listMajorLabTimeSlots());
  const { data: auditLog } = useCachedData<MajorScheduleAuditLogResult>(
    `major-schedule-audit:${syId}:${semesterNumber}`,
    () => authorityWorkflowService.listMajorScheduleAuditLogs({ syId, semesterNumber, perPage: 20 }),
    { enabled: scopeReady, cache: false },
  );
  const { data: instructors } = useCachedData("major-schedule-instructors", () => deanService.listDepartmentInstructors());
  const regularSemesters = semesters.filter((row) => row.semesterNumber !== 3);

  async function withRefresh(action: () => Promise<{ message?: string } | string>) {
    setSaving(true);
    setFormError(null);
    try {
      const result = await action();
      const message = typeof result === "string" ? result : result.message;
      if (message) toast.success(message);
      await Promise.all([reload(), user?.role === "registrar" ? reloadEditRequests() : Promise.resolve()]);
      return true;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submitMeeting(input: MajorScheduleMeetingInput) {
    const ok = await withRefresh(() => editTarget
      ? authorityWorkflowService.updateMajorSchedule(editTarget.id, input, user?.role === "registrar" ? "registrar" : "dean")
      : authorityWorkflowService.createMajorSchedule(input, user?.role === "registrar" ? "registrar" : "dean"));
    if (ok) { setMeetingOpen(false); setEditTarget(null); }
  }

  function openSubmissionDetail(submission: MajorScheduleSubmission) {
    setSubmissionDetail(submission);
    setDetailOpen(true);
  }

  async function openRequirements(submissionId: number) {
    setRequirementsOpen(true);
    setRequirements(null);
    setRequirementsError(null);
    try {
      setRequirements(await authorityWorkflowService.getMajorScheduleRequirements(submissionId));
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : "");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader title="Major Schedules" actions={user && ["dean", "registrar"].includes(user.role) ? <Button type="button" block={false} onClick={() => { setEditTarget(null); setMeetingOpen(true); setFormError(null); }}>New Major Meeting</Button> : undefined} />
      <div className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2">
        <FieldChrome id="major-school-year" label="School year">
          <Select items={schoolYears.map((year) => ({ value: String(year.id), label: year.schoolYear }))} value={syId ? String(syId) : ""} onValueChange={(value) => setSyId(Number(value))}>
            <SelectTrigger id="major-school-year"><SelectValue placeholder="Select school year" /></SelectTrigger>
            <SelectContent>{schoolYears.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.schoolYear}</SelectItem>)}</SelectContent>
          </Select>
        </FieldChrome>
        <FieldChrome id="major-semester" label="Semester">
          <Select items={regularSemesters.map((semester) => ({ value: String(semester.semesterNumber), label: semesterLabel(semester.semesterNumber) }))} value={semesterNumber ? String(semesterNumber) : ""} onValueChange={(value) => setSemesterNumber(Number(value))}>
            <SelectTrigger id="major-semester"><SelectValue placeholder="Select semester" /></SelectTrigger>
            <SelectContent>{regularSemesters.map((semester) => <SelectItem key={semester.semesterNumber} value={String(semester.semesterNumber)}>{semesterLabel(semester.semesterNumber)}</SelectItem>)}</SelectContent>
          </Select>
        </FieldChrome>
      </div>
      <div className="mt-3"><FormError message={formError} /></div>
      {labSlots?.labTimeSlots.length ? <MajorLaboratorySlotsCard slots={labSlots.labTimeSlots} requiredMeetingHours={labSlots.requiredMeetingHours} /> : null}

      <div className="mt-6 space-y-5">
        {error && submissions === null ? <EmptyState title="Couldn't load major schedules">{error}</EmptyState> : submissions === null ? <Skeleton className="h-72 rounded-xl" /> : submissions.length === 0 ? <EmptyState title="No major schedules">No major schedule submission exists for this term.</EmptyState> : submissions.map((submission) => (
          <section key={submission.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">{submission.departmentAbbrev} · Version {submission.version}</h2><p className="font-body text-xs text-slate-500 dark:text-slate-400">{submission.departmentName}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONES[submission.status] ?? "slate"}>{submission.status}</Badge>
                <Button type="button" variant="outline" block={false} onClick={() => openSubmissionDetail(submission)}>
                  <EyeIcon />
                  View Details
                </Button>
                {user?.role === "dean" && ["draft", "reopened"].includes(submission.status) && <Button type="button" block={false} onClick={() => void withRefresh(() => authorityWorkflowService.submitMajorSchedule(submission.id))}>Submit</Button>}
                {user?.role === "dean" && ["submitted", "finalized"].includes(submission.status) && <Button type="button" variant="outline" block={false} onClick={() => { setEditRequestTarget(submission); setFormError(null); }}>Request Edit</Button>}
                {user?.role === "registrar" && submission.status === "submitted" && <><Button type="button" variant="outline" block={false} onClick={() => void openRequirements(submission.id)}>Requirements</Button><Button type="button" variant="outline" block={false} onClick={async () => { setFormError(null); try { const result = await authorityWorkflowService.getMajorScheduleConflicts(submission.id); setConflicts(result.conflicts); if (result.message) toast.success(result.message); } catch (err) { setFormError(err instanceof Error ? err.message : ""); } }}>Check Conflicts</Button><Button type="button" block={false} onClick={() => void withRefresh(() => authorityWorkflowService.finalizeMajorSchedule(submission.id))}>Finalize</Button></>}
                {user?.role === "registrar" && submission.status === "finalized" && (
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    onClick={() => {
                      setReopenTarget(submission);
                      setFormError(null);
                    }}
                  >
                    Reopen
                  </Button>
                )}
              </div>
            </div>
            <Table>
              <TableHead>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Section</TableHeader>
                <TableHeader>Schedule</TableHeader>
                <TableHeader>Instructor</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader><span className="sr-only">Actions</span></TableHeader>
              </TableHead>
              <TableBody>
                {submission.schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <span className="font-semibold text-navy-700 dark:text-mist-100">{schedule.subjectCode}</span>
                      <span className="block text-xs text-slate-400">{schedule.subjectTitle}</span>
                    </TableCell>
                    <TableCell>{schedule.setName}</TableCell>
                    <TableCell>{schedule.dayOfWeek} · {schedule.startTime}–{schedule.endTime}</TableCell>
                    <TableCell>{schedule.instructorDisplay}</TableCell>
                    <TableCell>
                      <Badge tone={schedule.floating ? "gold" : "emerald"}>
                        {schedule.floating ? "Floating" : schedule.meetingKind}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {((user?.role === "dean" && ["draft", "reopened"].includes(submission.status)) ||
                          (user?.role === "registrar" && submission.status === "submitted")) && (
                          <Button
                            type="button"
                            variant="outline"
                            block={false}
                            onClick={() => {
                              setEditTarget(schedule);
                              setMeetingOpen(true);
                              setFormError(null);
                            }}
                          >
                            Edit
                          </Button>
                        )}
                        {user?.role === "dean" && ["draft", "reopened"].includes(submission.status) && (
                          <Button
                            type="button"
                            variant="danger"
                            block={false}
                            onClick={() => setDeleteTarget(schedule)}
                          >
                            Delete
                          </Button>
                        )}
                        {user?.role === "registrar" && schedule.floating && (
                          <Button
                            type="button"
                            block={false}
                            onClick={() => {
                              setFloatingTarget(schedule);
                              setFloatingInstructorId(0);
                              setFormError(null);
                            }}
                          >
                            Assign Instructor
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ))}
      </div>

      {user?.role === "registrar" && (editRequests?.length ?? 0) > 0 && <section className="mt-8"><h2 className="mb-3 font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">Edit Requests</h2><Table><TableHead><TableHeader>Submission</TableHeader><TableHeader>Reason</TableHeader><TableHeader>Status</TableHeader><TableHeader><span className="sr-only">Actions</span></TableHeader></TableHead><TableBody>{editRequests!.map((request) => <TableRow key={request.id}><TableCell>Submission #{request.submissionId}</TableCell><TableCell>{request.reason}</TableCell><TableCell><Badge tone={STATUS_TONES[request.status] ?? "slate"}>{request.status}</Badge></TableCell><TableCell>{request.status === "pending" && <div className="flex justify-end gap-2"><Button type="button" block={false} onClick={() => setDecisionTarget({ request, approve: true })}>Approve</Button><Button type="button" variant="danger" block={false} onClick={() => setDecisionTarget({ request, approve: false })}>Reject</Button></div>}</TableCell></TableRow>)}</TableBody></Table></section>}

      {auditLog && <section className="mt-8"><h2 className="mb-3 font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">Major Scheduling History</h2>{auditLog.items.length === 0 ? <EmptyState title="No history yet">Changes to this term's Major schedules will appear here.</EmptyState> : <Table><TableHead><TableHeader>Action</TableHeader><TableHeader>Submission</TableHeader><TableHeader>Performed by</TableHeader><TableHeader>Details</TableHeader></TableHead><TableBody>{auditLog.items.map((item) => <TableRow key={item.id}><TableCell>{item.actionLabel}</TableCell><TableCell>{item.departmentAbbrev ?? "—"}{item.submissionVersion != null ? ` · v${item.submissionVersion}` : ""}</TableCell><TableCell>{item.performedBy.name ?? "—"}</TableCell><TableCell>{item.reason ?? item.details ?? "—"}</TableCell></TableRow>)}</TableBody></Table>}</section>}
      {user?.role === "registrar" && submissions && <RegistrarMajorControls submissions={submissions} onDelete={setRegistrarDeleteTarget} />}
      <MajorMeetingModal open={meetingOpen} schedule={editTarget} syId={syId} semesterNumber={semesterNumber} schoolYear={schoolYears.find((row) => row.id === syId)?.schoolYear ?? ""} saving={saving} error={formError} onClose={() => { setMeetingOpen(false); setEditTarget(null); }} onSubmit={submitMeeting} />
      <RegistrarMajorDeleteDialog schedule={registrarDeleteTarget} saving={saving} error={formError} onClose={() => setRegistrarDeleteTarget(null)} onConfirm={async (reason) => { if (!registrarDeleteTarget) return; const ok = await withRefresh(() => authorityWorkflowService.deleteMajorSchedule(registrarDeleteTarget.id, "registrar", reason)); if (ok) setRegistrarDeleteTarget(null); }} />
      <Modal open={requirementsOpen} onClose={() => setRequirementsOpen(false)} title="Major Requirements" wide>{requirementsError ? <DataLoadAlert title="Requirements unavailable" message={requirementsError} /> : !requirements ? <Skeleton className="h-52 rounded-xl" /> : <div className="space-y-3"><p className="font-body text-sm text-slate-500 dark:text-slate-400">{requirements.unsatisfiedCount === 0 ? "All requirements are satisfied." : `${requirements.unsatisfiedCount} requirement${requirements.unsatisfiedCount === 1 ? "" : "s"} still need attention.`}</p><Table><TableHead><TableHeader>Section</TableHeader><TableHeader>Subject</TableHeader><TableHeader>Required</TableHeader><TableHeader>Status</TableHeader></TableHead><TableBody>{requirements.requirements.map((item) => <TableRow key={`${item.setId}:${item.subjectId}`}><TableCell>{item.setName}</TableCell><TableCell>{item.subjectCode} — {item.subjectTitle}</TableCell><TableCell>{item.requiredMeetingKinds.join(" + ")}</TableCell><TableCell><Badge tone={item.isSatisfied ? "emerald" : "gold"}>{item.isSatisfied ? "Complete" : `Missing ${item.missingMeetingKinds.join(", ")}`}</Badge></TableCell></TableRow>)}</TableBody></Table></div>}</Modal>
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Submission Details" wide>
        {detailLoading ? (
          <Skeleton className="h-52 rounded-xl" />
        ) : detailError ? (
          <DataLoadAlert title="Submission unavailable" message={detailError} />
        ) : submissionDetail ? (
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SubmissionField label="Department" value={`${submissionDetail.departmentAbbrev} — ${submissionDetail.departmentName}`} />
              <SubmissionField label="Version" value={String(submissionDetail.version)} />
              <SubmissionField label="Status" value={submissionDetail.status} />
              <SubmissionField label="Meetings" value={String(submissionDetail.schedules.length)} />
            </dl>
            {(submissionDetail.deletionNotes?.length ?? 0) > 0 && <div className="space-y-2"><h3 className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">Removed by the Registrar</h3>{submissionDetail.deletionNotes!.map((note) => <div key={note.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10"><p className="font-medium text-navy-700 dark:text-mist-100">{note.subjectCode ?? "Major meeting"} · {note.setName ?? "—"}</p><p className="mt-1 text-slate-500 dark:text-slate-400">{note.reason}</p><p className="mt-1 text-xs text-slate-400">{note.deletedBy ?? "Registrar"}</p></div>)}</div>}
            <Table>
              <TableHead><TableHeader>Subject</TableHeader><TableHeader>Section</TableHeader><TableHeader>Schedule</TableHeader><TableHeader>Instructor</TableHeader></TableHead>
              <TableBody>{submissionDetail.schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell><span className="font-semibold text-navy-700 dark:text-mist-100">{schedule.subjectCode}</span><span className="block text-xs text-slate-400">{schedule.subjectTitle}</span></TableCell>
                  <TableCell>{schedule.setName}</TableCell>
                  <TableCell>{schedule.dayOfWeek} · {schedule.startTime}–{schedule.endTime}</TableCell>
                  <TableCell>{schedule.instructorDisplay}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete Major Meeting" confirmLabel="Delete" loadingLabel="Deleting…" confirmVariant="danger" onConfirm={async () => { if (!deleteTarget) return; const message = await authorityWorkflowService.deleteMajorSchedule(deleteTarget.id); if (message) toast.success(message); await reload(); }}>Delete {deleteTarget?.subjectCode} from this draft?</ConfirmDialog>
      <Modal open={editRequestTarget !== null} onClose={() => setEditRequestTarget(null)} title="Request Schedule Edit"><form onSubmit={async (event) => { event.preventDefault(); const reason = String(new FormData(event.currentTarget).get("reason") ?? ""); const ok = await withRefresh(() => authorityWorkflowService.requestMajorScheduleEdit(editRequestTarget!.id, reason)); if (ok) setEditRequestTarget(null); }} className="space-y-4"><FormError message={formError} /><Textarea id="reason" name="reason" label="Reason" required minLength={10} /><ModalActions><Button type="button" variant="outline" block={false} onClick={() => setEditRequestTarget(null)}>Cancel</Button><Button type="submit" block={false} isLoading={saving} loadingLabel="Sending…">Send Request</Button></ModalActions></form></Modal>
      <Modal open={decisionTarget !== null} onClose={() => setDecisionTarget(null)} title={`${decisionTarget?.approve ? "Approve" : "Reject"} Edit Request`}><form onSubmit={async (event) => { event.preventDefault(); const note = String(new FormData(event.currentTarget).get("note") ?? ""); const ok = await withRefresh(() => authorityWorkflowService.decideMajorScheduleEdit(decisionTarget!.request.id, decisionTarget!.approve, note || undefined)); if (ok) setDecisionTarget(null); }} className="space-y-4"><FormError message={formError} /><Textarea id="note" name="note" label="Decision note" /><ModalActions><Button type="button" variant="outline" block={false} onClick={() => setDecisionTarget(null)}>Cancel</Button><Button type="submit" variant={decisionTarget?.approve ? "primary" : "danger"} block={false} isLoading={saving} loadingLabel="Saving…">Confirm</Button></ModalActions></form></Modal>
      <Modal open={conflicts !== null} onClose={() => setConflicts(null)} title="Submission Conflicts" wide>{conflicts?.length === 0 ? <EmptyState title="No conflicts">This submission is ready to finalize.</EmptyState> : <div className="space-y-2">{conflicts?.map((conflict) => <div key={`${conflict.scheduleId}:${conflict.conflictingScheduleId}`} className="border-b border-slate-200 pb-2 text-sm dark:border-white/10"><strong>{conflict.schedule.subjectCode}</strong> conflicts with <strong>{conflict.conflictingSchedule.subjectCode}</strong> ({conflict.conflictTypes.join(", ")}).</div>)}</div>}</Modal>
      <Modal open={floatingTarget !== null} onClose={() => setFloatingTarget(null)} title="Assign Floating Instructor"><form onSubmit={async (event) => { event.preventDefault(); if (!floatingInstructorId) { setFormError("Select an instructor."); return; } const ok = await withRefresh(() => authorityWorkflowService.assignFloatingInstructor(floatingTarget!.id, floatingInstructorId)); if (ok) setFloatingTarget(null); }} className="space-y-4" noValidate><FormError message={formError} /><FieldChrome id="floating-instructor" label="Instructor" required><Select items={(instructors ?? []).map((instructor) => ({ value: String(instructor.instructorProfileId), label: `${instructor.firstName} ${instructor.lastName}` }))} value={floatingInstructorId ? String(floatingInstructorId) : ""} onValueChange={(value) => setFloatingInstructorId(Number(value))}><SelectTrigger id="floating-instructor"><SelectValue placeholder="Select instructor" /></SelectTrigger><SelectContent>{(instructors ?? []).map((instructor) => <SelectItem key={instructor.instructorProfileId} value={String(instructor.instructorProfileId)}>{instructor.firstName} {instructor.lastName}</SelectItem>)}</SelectContent></Select></FieldChrome><ModalActions><Button type="button" variant="outline" block={false} onClick={() => setFloatingTarget(null)}>Cancel</Button><Button type="submit" block={false} isLoading={saving} loadingLabel="Assigning…" disabled={!floatingInstructorId}>Assign Instructor</Button></ModalActions></form></Modal>
      <Modal open={reopenTarget !== null} onClose={() => setReopenTarget(null)} title={`Reopen Finalized Submission (${reopenTarget?.departmentAbbrev ?? ""})`}>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
            if (reason.length < 10) {
              setFormError("Please provide an explanation of at least 10 characters.");
              return;
            }
            const ok = await withRefresh(() =>
              authorityWorkflowService.reopenFinalizedMajorSchedule(reopenTarget!.id, reason)
            );
            if (ok) setReopenTarget(null);
          }}
          className="space-y-4"
        >
          <FormError message={formError} />
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">
            Reopening this finalized major schedule will unprotect its meetings and return the submission to Registrar control. Please provide an explanation.
          </p>
          <Textarea id="reopen-reason" name="reason" label="Reason for reopening" required minLength={10} />
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setReopenTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" block={false} isLoading={saving} loadingLabel="Reopening…">
              Reopen Submission
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </div>
  );
}

function MajorLaboratorySlotsCard({ slots, requiredMeetingHours }: { slots: { startTime: string; endTime: string }[]; requiredMeetingHours: number | null }) {
  return (
    <Card className="relative mt-5 overflow-hidden border-blue-200 shadow-sm shadow-navy-900/5 dark:border-blue-400/15 dark:bg-surface-raised">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-gwc-blue via-blue-500 to-gold-400" />
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-gwc-blue ring-1 ring-blue-100 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
              <FlaskConicalIcon />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">Major Laboratory Schedule</h2>
              <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                Standard laboratory windows{requiredMeetingHours !== null ? ` · ${requiredMeetingHours} hours per meeting` : ""}
              </p>
            </div>
          </div>
          <Badge tone="navy">{slots.length} time slots</Badge>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot, index) => (
            <div key={`${slot.startTime}-${slot.endTime}`} className="group rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/70 dark:border-white/10 dark:bg-white/3 dark:hover:border-blue-400/20 dark:hover:bg-blue-400/5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Slot {String(index + 1).padStart(2, "0")}</span>
                <span className="text-blue-500 dark:text-blue-300"><ClockIcon size={14} /></span>
              </div>
              <p className="whitespace-nowrap font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                {formatTime12h(slot.startTime)} <span className="font-normal text-slate-400">–</span> {formatTime12h(slot.endTime)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function RegistrarMajorControls({ submissions, onDelete }: { submissions: MajorScheduleSubmission[]; onDelete: (schedule: MajorSchedule) => void }) {
  const schedules = submissions
    .filter((submission) => ["submitted", "finalized"].includes(submission.status))
    .flatMap((submission) => submission.schedules);
  if (schedules.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-1 font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">Registrar Major Schedule Control</h2>
      <p className="mb-3 font-body text-sm text-slate-500 dark:text-slate-400">Removing a submitted or finalized meeting permanently records a note for the owning Dean.</p>
      <Table><TableHead><TableHeader>Meeting</TableHeader><TableHeader>Section</TableHeader><TableHeader>Schedule</TableHeader><TableHeader><span className="sr-only">Action</span></TableHeader></TableHead><TableBody>{schedules.map((schedule) => <TableRow key={schedule.id}><TableCell>{schedule.subjectCode} — {schedule.subjectTitle}</TableCell><TableCell>{schedule.setName}</TableCell><TableCell>{schedule.dayOfWeek} · {schedule.startTime}–{schedule.endTime}</TableCell><TableCell><div className="flex justify-end"><Button type="button" variant="danger" block={false} onClick={() => onDelete(schedule)}>Remove</Button></div></TableCell></TableRow>)}</TableBody></Table>
    </section>
  );
}

function RegistrarMajorDeleteDialog({ schedule, saving, error, onClose, onConfirm }: { schedule: MajorSchedule | null; saving: boolean; error: string | null; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (schedule) setReason(""); }, [schedule]);
  return <Modal open={schedule !== null} onClose={onClose} title="Remove Major Meeting"><form onSubmit={(event) => { event.preventDefault(); void onConfirm(reason.trim()); }} className="space-y-4" noValidate><FormError message={error} /><p className="font-body text-sm text-slate-600 dark:text-slate-300">Remove {schedule?.subjectCode} from {schedule?.setName}? This is permanent; the reason is sent to the owning Dean.</p><Textarea id="registrar-delete-reason" name="reason" label="Reason for removal" value={reason} onChange={(event) => setReason(event.target.value)} required minLength={10} /><ModalActions><Button type="button" variant="outline" block={false} onClick={onClose}>Cancel</Button><Button type="submit" variant="danger" block={false} isLoading={saving} loadingLabel="Removing…" disabled={reason.trim().length < 10}>Remove meeting</Button></ModalActions></form></Modal>;
}

function SubmissionField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-body text-[0.7rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">{value}</dd>
    </div>
  );
}

function MajorMeetingModal({ open, schedule, syId, semesterNumber, schoolYear, saving, error, onClose, onSubmit }: { open: boolean; schedule: MajorSchedule | null; syId: number; semesterNumber: number; schoolYear: string; saving: boolean; error: string | null; onClose: () => void; onSubmit: (input: MajorScheduleMeetingInput) => Promise<void> }) {
  const { semesterLabel } = useSemesters();
  const [programId, setProgramId] = useState(0);
  const [setId, setSetId] = useState(0);
  const [subjectId, setSubjectId] = useState(0);
  const [instructorId, setInstructorId] = useState("floating");
  const [roomId, setRoomId] = useState(0);
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("7:00 AM");
  const [endTime, setEndTime] = useState("8:00 AM");
  const [mode, setMode] = useState("Lecture");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { data: programs, error: programsError, reload: reloadPrograms } = useCachedData("major-meeting-programs", () => programService.list());
  const selectedProgram = (programs ?? []).find((row) => row.id === programId);
  const { data: sets, error: setsError, reload: reloadSets } = useCachedData(`major-meeting-sets:${syId}:${semesterNumber}:${programId}`, () => setService.list({ syId, semesterNumber, programId }), { enabled: open && programId > 0 });
  const availableSets = (sets ?? []).filter((row) => !selectedProgram || row.program === selectedProgram.abbrev);
  const selectedSet = availableSets.find((row) => row.id === setId);
  const { data: subjects, error: subjectsError, reload: reloadSubjects } = useCachedData(`major-meeting-subjects:${schoolYear}:${semesterNumber}:${programId}:${selectedSet?.yearLevel ?? 0}`, () => scheduleService.listScheduleSubjects({ schoolYear, programId, semester: semesterNumber as 1 | 2, yearLevel: selectedSet?.yearLevel, includeScheduledSets: true }), { enabled: open && !!schoolYear && programId > 0 && !!selectedSet });
  const { data: rooms, error: roomsError, reload: reloadRooms } = useCachedData("major-meeting-rooms", () => scheduleService.listScheduleRooms(), { enabled: open });
  const instructors = (subjects ?? []).flatMap((subject) => subject.faculties).filter((faculty, index, all) => all.findIndex((item) => item.id === faculty.id) === index);
  const referenceDataError = programsError ?? setsError ?? subjectsError ?? roomsError;

  useEffect(() => {
    if (!open) return;
    setProgramId(schedule?.programId ?? 0);
    setSetId(schedule?.setId ?? 0);
    setSubjectId(schedule?.subjectId ?? 0);
    setInstructorId(schedule?.instructorId ? String(schedule.instructorId) : "floating");
    setRoomId(schedule?.roomId ?? 0);
    setDayOfWeek(schedule?.dayOfWeek ?? "Monday");
    setStartTime(schedule ? formatTime12h(schedule.startTime) : "7:00 AM");
    setEndTime(schedule ? formatTime12h(schedule.endTime) : "8:00 AM");
    setMode(schedule?.meetingKind === "LAB" ? "Laboratory" : "Lecture");
    setValidationError(null);
  }, [open, schedule]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!programId || !setId || !subjectId || !roomId) {
      setValidationError("Complete all required fields before saving.");
      return;
    }
    if (!startTime || !endTime) {
      setValidationError("Select both a start time and an end time.");
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setValidationError("End time must be after start time.");
      return;
    }
    setValidationError(null);
    void onSubmit({
      syId,
      semesterNumber,
      programId,
      setId,
      subjectId,
      instructorId: instructorId === "floating" ? null : Number(instructorId),
      roomId,
      dayOfWeek,
      startTime: normalizeTime(startTime),
      endTime: normalizeTime(endTime),
      mode,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={schedule ? "Edit Major Meeting" : "New Major Meeting"} wide>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormError message={validationError ?? error} />

        {programsError && <DataLoadAlert title="Programs unavailable" message={programsError} onRetry={reloadPrograms} />}
        {setsError && <DataLoadAlert title="Sections unavailable" message={setsError} onRetry={reloadSets} />}
        {subjectsError && <DataLoadAlert title="Subject and instructor options unavailable" message={subjectsError} onRetry={reloadSubjects} permission helpText="Ask an administrator to grant access to subject instructor information." />}
        {roomsError && <DataLoadAlert title="Rooms unavailable" message={roomsError} onRetry={reloadRooms} />}

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-400/15 dark:bg-blue-400/5">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Teaching term</p>
          <p className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">{schoolYear} · {semesterLabel(semesterNumber)}</p>
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-3 font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Academic assignment</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldChrome id="major-program" label="Program" required>
              <Select items={(programs ?? []).map((program) => ({ value: String(program.id), label: `${program.abbrev} — ${program.name}` }))} value={programId ? String(programId) : ""} onValueChange={(value) => { setProgramId(Number(value)); setSetId(0); setSubjectId(0); setInstructorId("floating"); }}>
                <SelectTrigger id="major-program"><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>{(programs ?? []).map((program) => <SelectItem key={program.id} value={String(program.id)}>{program.abbrev} — {program.name}</SelectItem>)}</SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="major-set" label="Section" required hint={programId ? undefined : "Select a program first."}>
              <Select items={availableSets.map((set) => ({ value: String(set.id), label: `${set.program}-${set.yearLevel}${set.setCode}` }))} value={setId ? String(setId) : ""} onValueChange={(value) => { setSetId(Number(value)); setSubjectId(0); setInstructorId("floating"); }} disabled={!programId}>
                <SelectTrigger id="major-set"><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>{availableSets.map((set) => <SelectItem key={set.id} value={String(set.id)}>{set.program}-{set.yearLevel}{set.setCode}</SelectItem>)}</SelectContent>
              </Select>
            </FieldChrome>
          </div>
          <FieldChrome id="major-subject" label="Subject" required hint={setId ? undefined : "Select a section to load its subjects."}>
            <Select items={(subjects ?? []).map((subject) => ({ value: String(subject.id), label: `${subject.code} — ${subject.title}` }))} value={subjectId ? String(subjectId) : ""} onValueChange={(value) => setSubjectId(Number(value))} disabled={!setId}>
              <SelectTrigger id="major-subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>{(subjects ?? []).map((subject) => <SelectItem key={subject.id} value={String(subject.id)}>{subject.code} — {subject.title}</SelectItem>)}</SelectContent>
            </Select>
          </FieldChrome>
        </fieldset>

        <fieldset className="space-y-3 border-t border-slate-200 pt-4 dark:border-white/10">
          <legend className="mb-3 font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Room and instructor</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldChrome id="major-instructor" label="Instructor" hint="Leave floating when an instructor has not been assigned.">
              <Select items={[{ value: "floating", label: "TBA / Floating" }, ...instructors.map((faculty) => ({ value: String(faculty.id), label: faculty.fullName }))]} value={instructorId} onValueChange={(value) => setInstructorId(value ?? "floating")}>
                <SelectTrigger id="major-instructor"><SelectValue placeholder="TBA / Floating" /></SelectTrigger>
                <SelectContent><SelectItem value="floating">TBA / Floating</SelectItem>{instructors.map((faculty) => <SelectItem key={faculty.id} value={String(faculty.id)}>{faculty.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="major-room" label="Room" required>
              <Select items={(rooms ?? []).map((room) => ({ value: String(room.id), label: `${room.buildingName} · ${room.roomName}` }))} value={roomId ? String(roomId) : ""} onValueChange={(value) => setRoomId(Number(value))}>
                <SelectTrigger id="major-room"><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>{(rooms ?? []).map((room) => <SelectItem key={room.id} value={String(room.id)}>{room.buildingName} · {room.roomName}</SelectItem>)}</SelectContent>
              </Select>
            </FieldChrome>
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-slate-200 pt-4 dark:border-white/10">
          <legend className="mb-3 font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Meeting pattern</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldChrome id="major-day" label="Day" required>
              <Select items={Object.values(DAY_LABELS).map((day) => ({ value: day, label: day }))} value={dayOfWeek} onValueChange={(value) => setDayOfWeek(value ?? "Monday")}>
                <SelectTrigger id="major-day"><SelectValue placeholder="Select day" /></SelectTrigger>
                <SelectContent>{Object.values(DAY_LABELS).map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="major-mode" label="Meeting mode" required>
              <Select items={["Lecture", "Laboratory", "F2F", "Online"].map((item) => ({ value: item, label: item }))} value={mode} onValueChange={(value) => setMode(value ?? "Lecture")}>
                <SelectTrigger id="major-mode"><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>{["Lecture", "Laboratory", "F2F", "Online"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="major-start-time" label="Start time" required>
              <Select items={TIME_OPTIONS.map((time) => ({ value: time, label: time }))} value={startTime} onValueChange={(value) => { const next = value ?? ""; setStartTime(next); if (endTime && timeToMinutes(endTime) <= timeToMinutes(next)) setEndTime(""); }}>
                <SelectTrigger id="major-start-time"><SelectValue placeholder="Select start time" /></SelectTrigger>
                <SelectContent>{TIME_OPTIONS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="major-end-time" label="End time" required hint={startTime ? undefined : "Select a start time first."}>
              <Select items={TIME_OPTIONS.filter((time) => !startTime || timeToMinutes(time) > timeToMinutes(startTime)).map((time) => ({ value: time, label: time }))} value={endTime} onValueChange={(value) => setEndTime(value ?? "")} disabled={!startTime}>
                <SelectTrigger id="major-end-time"><SelectValue placeholder="Select end time" /></SelectTrigger>
                <SelectContent>{TIME_OPTIONS.filter((time) => !startTime || timeToMinutes(time) > timeToMinutes(startTime)).map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
              </Select>
            </FieldChrome>
          </div>
        </fieldset>

        <ModalActions>
          <Button type="button" variant="outline" block={false} onClick={onClose}>Cancel</Button>
          <Button type="submit" block={false} isLoading={saving} loadingLabel="Saving…" disabled={Boolean(referenceDataError)}>{schedule ? "Save Changes" : "Create Meeting"}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export default function MajorSchedulesRoute() {
  return <RoleGuard allow={["dean", "registrar"]}><MajorSchedulesPage /></RoleGuard>;
}
