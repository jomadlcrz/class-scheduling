import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/forms/form-error";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Textarea } from "~/components/ui/textarea";
import { InstructorHoldingsSummary } from "~/features/schedules/instructor-holdings-summary";
import { formatTime12h } from "~/lib/time";
import { publishedAmendmentsService } from "~/services/published-amendments.service";
import type { ScheduleFacultyOption, ScheduleRoomOption } from "~/services/schedule.service";
import {
  CLASS_MODE_CHOICES,
  type AmendableMeeting,
  type InstructorHoldings,
} from "~/types/published-amendments";

const MINIMUM_REASON = 10;

type Tab = "instructor" | "delivery" | "vacate";

export function PublishedAmendmentModal({
  open,
  onClose,
  meeting,
  facultyOptions,
  roomOptions,
  onAmended,
}: {
  open: boolean;
  onClose: () => void;
  /** The selected published meeting, or null while none is chosen. */
  meeting: AmendableMeeting | null;
  /**
   * Instructors the subject already has. The backend still checks the exact
   * curriculum offering — program, semester AND year level.
   */
  facultyOptions: ScheduleFacultyOption[];
  roomOptions: ScheduleRoomOption[];
  onAmended: () => void;
}) {
  const [tab, setTab] = useState<Tab>("instructor");
  const [reason, setReason] = useState("");
  const [instructorValue, setInstructorValue] = useState("");
  const [classMode, setClassMode] = useState("");
  const [roomValue, setRoomValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<InstructorHoldings | null>(null);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [holdingsError, setHoldingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !meeting) return;
    setTab("instructor");
    setReason("");
    setError(null);
    setInstructorValue(meeting.instructorId != null ? String(meeting.instructorId) : "tba");
    setClassMode(meeting.classMode);
    setRoomValue("keep");
    setHoldings(null);
    setHoldingsError(null);
  }, [open, meeting?.scheduleId]);

  const departingInstructorId = meeting?.instructorId ?? null;
  const termSyId = meeting?.syId ?? null;
  const termSemesterNumber = meeting?.semesterNumber ?? null;

  useEffect(() => {
    if (
      !open ||
      tab !== "vacate" ||
      departingInstructorId == null ||
      termSyId == null ||
      termSemesterNumber == null
    ) {
      return;
    }
    let cancelled = false;
    setHoldingsLoading(true);
    setHoldingsError(null);
    publishedAmendmentsService
      .getHoldings(departingInstructorId, { syId: termSyId, semesterNumber: termSemesterNumber })
      .then((result) => {
        if (!cancelled) setHoldings(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setHoldings(null);
          setHoldingsError(
            err instanceof Error ? err.message : "Unable to load what this instructor is teaching.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setHoldingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, departingInstructorId, termSyId, termSemesterNumber]);

  const chosenMode = useMemo(
    () => CLASS_MODE_CHOICES.find((choice) => choice.value === classMode) ?? null,
    [classMode],
  );

  if (!meeting) return null;

  const reasonReady = reason.trim().length >= MINIMUM_REASON;
  const instructorChanged =
    instructorValue !== (meeting.instructorId != null ? String(meeting.instructorId) : "tba");
  const deliveryChanged = classMode !== meeting.classMode || roomValue !== "keep";
  const vacateCount = holdings?.meetingCount ?? 0;

  const tabs: [Tab, string][] = [
    ["instructor", "Instructor"],
    ["delivery", "Delivery mode"],
    ...(meeting.instructorId != null ? ([["vacate", "Instructor left"]] as [Tab, string][]) : []),
  ];

  async function submitInstructor() {
    if (!meeting) return;
    setSaving(true);
    setError(null);
    try {
      const result = await publishedAmendmentsService.setInstructor(meeting.scheduleId, {
        instructorId: instructorValue === "tba" ? null : Number(instructorValue),
        reason: reason.trim(),
      });
      toast.success(result.message);
      onAmended();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change the instructor.");
    } finally {
      setSaving(false);
    }
  }

  async function submitDelivery() {
    if (!meeting) return;
    setSaving(true);
    setError(null);
    try {
      const result = await publishedAmendmentsService.setClassMode(meeting.scheduleId, {
        classMode,
        reason: reason.trim(),
        ...(roomValue === "keep"
          ? {}
          : { roomId: roomValue === "none" ? null : Number(roomValue) }),
      });
      toast.success(result.message);
      if (result.divergesFromPolicy) {
        toast.warning(
          "This now differs from the delivery plan set for the term. The change stands — the plan is guidance, not a rule.",
        );
      }
      onAmended();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change the delivery mode.");
    } finally {
      setSaving(false);
    }
  }

  async function submitVacate() {
    if (!meeting || meeting.instructorId == null) return;
    setSaving(true);
    setError(null);
    try {
      const result = await publishedAmendmentsService.vacateTerm(meeting.instructorId, {
        syId: meeting.syId,
        semesterNumber: meeting.semesterNumber,
        reason: reason.trim(),
      });
      toast.success(result.message);
      onAmended();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to vacate this instructor's classes.");
    } finally {
      setSaving(false);
    }
  }

  const submitDisabled =
    !reasonReady ||
    (tab === "instructor"
      ? !instructorChanged
      : tab === "delivery"
        ? !deliveryChanged
        : holdingsLoading || vacateCount === 0);

  const submitLabel =
    tab === "instructor"
      ? "Change instructor"
      : tab === "delivery"
        ? "Change delivery"
        : `Make ${vacateCount} meeting${vacateCount === 1 ? "" : "s"} TBA`;

  return (
    <Modal open={open} onClose={onClose} title="Amend a published class" wide>
      <div className="grid gap-3">
        <FormError message={error} />

        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
          <p className="font-body text-xs font-bold text-navy-800 dark:text-white">
            {meeting.subjectCode} · {meeting.setName}
          </p>
          <p className="mt-0.5 font-body text-[11px] text-slate-500 dark:text-slate-400">
            {meeting.dayOfWeek}
            {meeting.startTime && meeting.endTime
              ? ` · ${formatTime12h(meeting.startTime)}–${formatTime12h(meeting.endTime)}`
              : ""}
            {` · ${meeting.roomName ?? "No room"}`}
            {` · ${meeting.instructorName ?? "TBA"}`}
          </p>
          <p className="mt-2 font-body text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            This schedule is published, so its day, time, section and subject are
            fixed. Those are what the Dean approved and what students have been
            attending. Who teaches it and how it is delivered can still change.
          </p>
        </div>

        <div
          className={`grid ${tabs.length === 3 ? "grid-cols-3" : "grid-cols-2"} divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-300 dark:divide-white/10 dark:border-white/15`}
        >
          {tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className={`cursor-pointer px-3 py-2 font-body text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 ${
                tab === value
                  ? "bg-navy-800 text-white dark:bg-white/15"
                  : "bg-white text-navy-700 hover:bg-slate-100 dark:bg-surface-raised dark:text-slate-200 dark:hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "instructor" ? (
          <label className="grid gap-1">
            <span className="font-body text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Who teaches it
            </span>
            <select
              value={instructorValue}
              onChange={(event) => setInstructorValue(event.target.value)}
              className={inputClassName}
            >
              <option value="tba">TBA — nobody assigned</option>
              {facultyOptions.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.fullName}
                </option>
              ))}
            </select>
            <span className="font-body text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              This changes <span className="font-semibold">every meeting of{" "}
              {meeting.subjectCode ?? "this subject"}</span> for {meeting.setName ?? "this section"},
              not only the one shown above — one subject in one section is taught by one
              instructor. All of them change, or none do.
            </span>
            <span className="font-body text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              A replacement must already be assigned to this subject offering in
              Subject Assignment — by the Dean for a Major subject, by the
              Registrar for a GenEd or minor subject. If they are not, this is
              refused.
            </span>
          </label>
        ) : tab === "vacate" ? (
          <div className="grid gap-2">
            <p className="font-body text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Takes{" "}
              <span className="font-semibold text-navy-700 dark:text-mist-100">
                {meeting.instructorName}
              </span>{" "}
              off <span className="font-semibold">every class they hold this term</span> — in every
              section, not only {meeting.setName ?? "this one"}. Each class keeps its day, time,
              room and section, and shows as TBA until a replacement takes it.
            </p>
            {holdingsLoading ? (
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                Checking what they are still teaching…
              </p>
            ) : holdingsError ? (
              <FormError message={holdingsError} />
            ) : holdings ? (
              holdings.meetingCount > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5 dark:border-gold-400/25 dark:bg-gold-400/[0.06]">
                  <p className="font-body text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:text-gold-300">
                    These become TBA
                  </p>
                  <InstructorHoldingsSummary holdings={holdings} />
                </div>
              ) : (
                <Badge tone="slate">They hold no classes this term</Badge>
              )
            ) : null}
            <span className="font-body text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Afterwards, assign the replacement to each subject in Subject Assignment
              — the Dean does Major subjects, the Registrar does GenEd and minor
              subjects — then put them on each class with the Instructor tab.
            </span>
          </div>
        ) : (
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="font-body text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                How it is delivered
              </span>
              <select
                value={classMode}
                onChange={(event) => {
                  setClassMode(event.target.value);
                  setRoomValue("keep");
                }}
                className={inputClassName}
              >
                {CLASS_MODE_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
              {chosenMode ? (
                <span className="font-body text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {chosenMode.hint}
                </span>
              ) : null}
            </label>

            {chosenMode && chosenMode.roomRule !== "forbids" ? (
              <label className="grid gap-1">
                <span className="font-body text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Room
                </span>
                <select
                  value={roomValue}
                  onChange={(event) => setRoomValue(event.target.value)}
                  className={inputClassName}
                >
                  <option value="keep">
                    {meeting.roomName ? `Keep ${meeting.roomName}` : "Keep as it is"}
                  </option>
                  {chosenMode.roomRule === "optional" ? (
                    <option value="none">No room — online this week</option>
                  ) : null}
                  {roomOptions.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomName} · {room.buildingName}
                    </option>
                  ))}
                </select>
                {chosenMode.roomRule === "requires" && !meeting.roomName ? (
                  <span className="font-body text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                    This class holds no room right now, so face-to-face needs one
                    chosen here.
                  </span>
                ) : null}
              </label>
            ) : (
              <Badge tone="slate">
                {meeting.roomName
                  ? `${meeting.roomName} will be released`
                  : "No room to release"}
              </Badge>
            )}
          </div>
        )}

        <Textarea
          id="amendment-reason"
          label="Reason"
          required
          hint={
            tab === "vacate"
              ? `Sent to the students of every affected section, the instructor and the Dean. At least ${MINIMUM_REASON} characters.`
              : `Sent to the students in this section, both instructors and the Dean. At least ${MINIMUM_REASON} characters.`
          }
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Instructor resigned effective this week."
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={tab === "vacate" ? "danger" : "primary"}
            block={false}
            isLoading={saving}
            disabled={submitDisabled}
            onClick={() =>
              void (tab === "instructor"
                ? submitInstructor()
                : tab === "delivery"
                  ? submitDelivery()
                  : submitVacate())
            }
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
