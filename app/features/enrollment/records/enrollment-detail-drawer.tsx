import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Drawer } from "~/components/ui/drawer";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { ImageViewer } from "~/components/ui/image-viewer";
import { ProfileAvatar } from "~/components/ui/profile-avatar";
import { Spinner } from "~/components/ui/spinner";
import {
  CloseIcon,
  EditIcon,
  LogoutIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PrinterIcon,
  RefreshCwIcon,
  TrashIcon,
  UserOffIcon,
} from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { enrollmentService } from "~/services/enrollment.service";
import { studentService } from "~/services/student.service";
import { openRegistrationPrint } from "~/features/enrollment/print-registration";
import { useYearLevels } from "~/hooks/use-year-levels";
import { EditRecordModal } from "~/features/enrollment/records/edit-record-modal";
import type { EnrollmentRow, EnrollmentStudent } from "~/types/enrollment";
import type { StudentAcademicRecord, StudentProfileDetail } from "~/types/student";

const STATE_TONES: Record<string, BadgeTone> = {
  Enrolled: "emerald",
  Dropped: "red",
  Withdrawn: "gold",
  Voided: "slate",
};

function accountTone(accountStatus: string): BadgeTone {
  return accountStatus.toLowerCase().includes("no") ? "slate" : "emerald";
}

const STATES = ["Enrolled", "Dropped", "Withdrawn", "Voided"] as const;

function StateActionIcon({ state }: { state: (typeof STATES)[number] }) {
  if (state === "Dropped") {
    return <span className="text-red-500 dark:text-red-400"><UserOffIcon /></span>;
  }
  if (state === "Withdrawn") {
    return <span className="text-gold-600 dark:text-gold-400"><LogoutIcon /></span>;
  }
  if (state === "Voided") {
    return <span className="text-slate-500 dark:text-slate-400"><CloseIcon size={16} /></span>;
  }
  return <span className="text-emerald-600 dark:text-emerald-400"><RefreshCwIcon /></span>;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

type Tab = "info" | "subjects" | "history";

type Props = {
  student: EnrollmentStudent | null;
  enrollment: EnrollmentRow | null;
  genders: string[];
  nameSuffixes: string[];
  onClose: () => void;
  onChanged: () => void;
  readOnly?: boolean;
};

function Field({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : "min-w-0"}>
      <dt className="font-body text-[0.7rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 font-body text-sm text-navy-700 dark:text-mist-100">{value}</dd>
    </div>
  );
}

function tabClass(active: boolean): string {
  return `-mb-px border-b-2 px-3 py-2 font-body text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    active
      ? "border-navy-700 text-navy-700 dark:border-mist-100 dark:text-mist-100"
      : "border-transparent text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-mist-100"
  }`;
}

export function EnrollmentDetailDrawer({ student, enrollment, genders, nameSuffixes, onClose, onChanged, readOnly = false }: Props) {
  const [tab, setTab] = useState<Tab>("info");
  const [pendingState, setPendingState] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [rawPhotoUrl, setRawPhotoUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<StudentAcademicRecord[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [profile, setProfile] = useState<StudentProfileDetail | null>(null);
  const [editRecordOpen, setEditRecordOpen] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const { yearLevelLabel } = useYearLevels();

  const open = student !== null && enrollment !== null;

  useEffect(() => {
    if (open) {
      setTab("info");
      setHistory(null);
      setProfile(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && student && !readOnly) {
      studentService.getProfile(student.studentProfileId).then(setProfile);
    }
  }, [open, readOnly, student]);

  useEffect(() => () => { if (rawPhotoUrl) URL.revokeObjectURL(rawPhotoUrl); }, [rawPhotoUrl]);

  async function openPhoto() {
    if (!student) return;
    if (!readOnly) {
      try {
        await studentService.getProfilePhoto(student.studentProfileId);
        const blob = await studentService.getProfilePhotoRaw(student.studentProfileId);
        setRawPhotoUrl(URL.createObjectURL(blob));
      } catch {
        setRawPhotoUrl(null);
      }
    }
    setImageViewerOpen(true);
  }

  useEffect(() => {
    if (open && tab === "history" && history === null) {
      setHistoryLoading(true);
      studentService
        .getEnrollments(student!.studentProfileId, readOnly ? "dean" : "registrar")
        .then(setHistory)
        .finally(() => setHistoryLoading(false));
    }
  }, [open, tab, history, readOnly, student]);

  async function applyState() {
    if (!enrollment || !pendingState) return;
    const message = await enrollmentService.setEnrollmentState(enrollment.enrollmentId, pendingState);
    if (message) toast.success(message);
    onChanged();
    onClose();
  }

  async function applyDelete() {
    if (!enrollment) return;
    const message = await enrollmentService.deleteEnrollment(enrollment.enrollmentId);
    if (message) toast.success(message);
    onChanged();
    onClose();
  }

  async function handlePrintCOR() {
    if (!enrollment) return;
    setPrintLoading(true);
    try {
      const registration = await enrollmentService.getRegistration(enrollment.enrollmentId);
      await openRegistrationPrint(registration);
    } catch {
      toast.error("Failed to load registration data");
    } finally {
      setPrintLoading(false);
    }
  }

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Student Details" wide>
        {enrollment && student && (
          <div className="flex flex-col gap-6">
            <section className="flex items-center gap-4">
              {student.profilePhotoUrl ? (
                <button
                  type="button"
                  onClick={() => void openPhoto()}
                  className="shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  aria-label="View profile photo"
                >
                  <img
                    src={student.profilePhotoUrl}
                    alt={student.name}
                    className="size-16 rounded-full object-cover"
                  />
                </button>
                ) : <ProfileAvatar gender={student.gender} className="size-16" />}
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="truncate font-body text-base font-semibold text-navy-800 dark:text-mist-100">
                  {student.name}
                </h3>
                <p className="truncate font-body text-xs text-slate-500 dark:text-slate-400">
                  {student.studentId ?? "No ID"}
                  {student.gender && <span> · {student.gender}</span>}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone={STATE_TONES[enrollment.enrollmentState] ?? "slate"}>
                    {enrollment.enrollmentState}
                  </Badge>
                  <Badge tone={accountTone(student.accountStatus)}>{student.accountStatus}</Badge>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      block={false}
                      disabled={printLoading}
                      onClick={() => void handlePrintCOR()}
                    >
                      <PrinterIcon size={14} />
                      Print COR
                    </Button>
                  )}
                  {!readOnly && (
                    <Button type="button" variant="outline" block={false} onClick={() => setEditRecordOpen(true)}>
                      <EditIcon />
                      Edit Record
                    </Button>
                  )}
                </div>
                {(student.mobile || student.email || profile?.address) && (
                  <div className="mt-1 flex min-w-0 flex-col gap-1 font-body text-xs text-slate-500 dark:text-slate-400">
                    {student.mobile && (
                      <a href={`tel:${student.mobile}`} className="flex min-w-0 items-center gap-1.5 hover:underline">
                        <span aria-hidden="true" className="shrink-0 text-slate-400 dark:text-slate-500">
                          <PhoneIcon size={13} />
                        </span>
                        <span className="truncate">{student.mobile}</span>
                      </a>
                    )}
                    {student.email && (
                      <a href={`mailto:${student.email}`} className="flex min-w-0 items-center gap-1.5 hover:underline">
                        <span aria-hidden="true" className="shrink-0 text-slate-400 dark:text-slate-500">
                          <MailIcon size={13} />
                        </span>
                        <span className="truncate">{student.email}</span>
                      </a>
                    )}
                    {profile?.address && (
                      <p className="flex min-w-0 items-start gap-1.5">
                        <span aria-hidden="true" className="mt-px shrink-0 text-slate-400 dark:text-slate-500">
                          <MapPinIcon size={13} />
                        </span>
                        <span className="truncate">
                          {[profile.address.street, profile.address.barangay, profile.address.cityMunicipality, profile.address.province]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>

            <div className="-mx-2 flex border-b border-slate-200 dark:border-white/10">
              <button type="button" className={tabClass(tab === "info")} onClick={() => setTab("info")}>
                Enrollment Information
              </button>
              <button type="button" className={tabClass(tab === "subjects")} onClick={() => setTab("subjects")}>
                Subject Load
              </button>
              {!readOnly && <button type="button" className={tabClass(tab === "history")} onClick={() => setTab("history")}>History</button>}
            </div>

            {tab === "info" && <InfoTab enrollment={enrollment} yearLevelLabel={yearLevelLabel} />}
            {tab === "subjects" && <SubjectsTab enrollment={enrollment} />}
            {tab === "history" && (
              <HistoryTab records={history} loading={historyLoading} yearLevelLabel={yearLevelLabel} studentProfileId={student.studentProfileId} />
            )}

            {!readOnly && <section>
              <h3 className="mb-2 font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                Change state
              </h3>
              <div className="flex flex-wrap gap-2">
                {STATES.filter((s) => s !== enrollment.enrollmentState).map((s) => (
                  <Button key={s} type="button" variant="outline" block={false} onClick={() => setPendingState(s)}>
                    <StateActionIcon state={s} />
                    Mark as {s}
                  </Button>
                ))}
              </div>
            </section>}

            {!readOnly && <section className="border-t border-slate-100 pt-4 dark:border-white/8">
              <Button
                type="button"
                variant="danger"
                block={false}
                disabled={enrollment.termClosed}
                onClick={() => setDeleteOpen(true)}
              >
                <TrashIcon />
                Delete enrollment
              </Button>
              {enrollment.termClosed && (
                <p className="mt-1.5 font-body text-xs text-slate-400 dark:text-slate-500">
                  Deleting is disabled once the term is closed — use a state change (drop/withdraw/void) instead.
                </p>
              )}
            </section>}
          </div>
        )}
      </Drawer>

      {student?.profilePhotoUrl && (
        <ImageViewer
          open={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          src={rawPhotoUrl ?? student.profilePhotoUrl}
          alt={student.name}
        />
      )}

      <ConfirmDialog
        open={pendingState !== null}
        onClose={() => setPendingState(null)}
        title={`Mark ${student?.name ?? "student"} as ${pendingState}?`}
        confirmLabel={`Mark as ${pendingState}`}
        loadingLabel="Updating…"
        onConfirm={applyState}
      >
        This sets the enrollment state for {enrollment?.schoolYear ?? "this term"} · Sem{" "}
        {enrollment?.semesterNumber}. State changes are allowed even after the term is closed.
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete enrollment"
        confirmLabel="Delete"
        confirmVariant="danger"
        loadingLabel="Deleting…"
        onConfirm={applyDelete}
      >
        Permanently remove {student?.name}'s enrollment for this term? This can't be undone. To keep a record
        instead, drop or withdraw the student.
      </ConfirmDialog>

      {!readOnly && enrollment && student && (
        <EditRecordModal
          open={editRecordOpen}
          studentProfileId={student.studentProfileId}
          enrollment={enrollment}
          genders={genders}
          nameSuffixes={nameSuffixes}
          onClose={() => setEditRecordOpen(false)}
        />
      )}
    </>
  );
}

function InfoTab({ enrollment, yearLevelLabel }: { enrollment: EnrollmentRow; yearLevelLabel: (n: number) => string }) {
  return (
    <section>
      <h3 className="mb-2 font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
        Enrollment
      </h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <Field label="Term" value={`${enrollment.schoolYear ?? "—"} · ${ordinal(enrollment.semesterNumber)} Semester`} wide />
        <Field label="Program" value={enrollment.program ?? "—"} wide />
        <Field label="Year level" value={enrollment.yearLevel ? yearLevelLabel(enrollment.yearLevel) : "—"} />
        <Field label="Type" value={enrollment.enrolledStatus} />
        <Field
          label="Set"
          value={enrollment.set ?? <span className="text-slate-400">No set (irregular)</span>}
        />
        <Field label="Student type" value={enrollment.studentType ?? "—"} />
      </dl>
    </section>
  );
}

function SubjectsTab({ enrollment }: { enrollment: EnrollmentRow }) {
  const totalUnits = enrollment.subjects.reduce((sum, s) => sum + (s.units ?? 0), 0);

  return (
    <section>
      <h3 className="mb-2 font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
        Subjects
        <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
          ({enrollment.subjects.length})
        </span>
      </h3>
      {enrollment.subjects.length === 0 ? (
        <p className="font-body text-sm text-slate-500 dark:text-slate-400">
          No subjects recorded for this enrollment.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-white/8 dark:border-white/10">
          {enrollment.subjects.map((s) => (
            <li key={s.subjectId} className="flex items-baseline justify-between gap-3 px-3 py-2">
              <span className="min-w-0">
                <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                  {s.subjectCode ?? "—"}
                </span>
                {s.descriptiveTitle && (
                  <span className="block truncate font-body text-xs text-slate-500 dark:text-slate-400">
                    {s.descriptiveTitle}
                  </span>
                )}
              </span>
              {s.units != null && (
                <span className="shrink-0 font-body text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {s.units} unit{s.units === 1 ? "" : "s"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {enrollment.subjects.length > 0 && (
        <p className="mt-2 text-right font-body text-xs font-medium tabular-nums text-navy-700 dark:text-mist-100">
          Total: {totalUnits} unit{totalUnits === 1 ? "" : "s"}
        </p>
      )}
    </section>
  );
}

function HistoryTab({
  records,
  loading,
  yearLevelLabel,
  studentProfileId: _studentProfileId,
}: {
  records: StudentAcademicRecord[] | null;
  loading: boolean;
  yearLevelLabel: (n: number) => string;
  studentProfileId: number;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <p className="py-4 text-center font-body text-sm text-slate-500 dark:text-slate-400">
        No enrollment history found.
      </p>
    );
  }

  return (
    <section>
      <Accordion>
        {records.map((r, i) => (
          <AccordionItem
            key={r.studentAcademicId}
            defaultOpen={i === 0}
            title={
              <div className="flex items-center gap-2">
                <span className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
                  {r.schoolYear ?? "—"} · {r.semester ?? "—"}
                </span>
                <Badge tone={STATE_TONES[r.enrollmentState ?? ""] ?? "slate"}>
                  {r.enrollmentState ?? "—"}
                </Badge>
              </div>
            }
          >
            <div className="px-5 py-3">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Field label="Program" value={r.program ?? "—"} />
                <Field label="Year level" value={r.yearLevel ? yearLevelLabel(r.yearLevel) : "—"} />
                <Field label="Set" value={r.set ?? "—"} />
                <Field label="Type" value={r.enrolledStatus} />
              </dl>
              {r.enrolledSubjects.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 font-body text-[0.7rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Subjects ({r.enrolledSubjects.length})
                  </p>
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-white/8 dark:border-white/10">
                    {r.enrolledSubjects.map((s) => (
                      <li key={s.subjectId} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                        <span className="font-body text-xs font-medium text-navy-700 dark:text-mist-100">
                          {s.subjectCode}
                        </span>
                        <span className="shrink-0 font-body text-[0.7rem] tabular-nums text-slate-500 dark:text-slate-400">
                          {s.units} unit{s.units === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-right font-body text-[0.7rem] font-medium tabular-nums text-navy-700 dark:text-mist-100">
                    Total: {r.enrolledSubjects.reduce((sum, s) => sum + s.units, 0)} unit{r.enrolledSubjects.reduce((sum, s) => sum + s.units, 0) === 1 ? "" : "s"}
                  </p>
                </div>
              )}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
