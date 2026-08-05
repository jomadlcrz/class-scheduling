import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { AlertIcon, PlusIcon, PrinterIcon, TrashIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { openSchedulePrint } from "~/features/schedules/print-schedule";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { timeToMinutes } from "~/lib/time";
import { enumService } from "~/services/enum.service";
import {
  scheduleService,
  type ScheduleRoomOption,
  type ScheduledSetOption,
  type UnseatedIrregularStudent,
} from "~/services/schedule.service";
import {
  DAYS,
  formatTime,
  generateTimeSlots,
  parseTime12h,
  type Schedule,
  SCHEDULE_MODES,
  type ScheduleSemester,
} from "~/types/schedule";

const TIME_OPTIONS = generateTimeSlots().map(formatTime);

export function meta() {
  return [
    { title: "Regular Class — GWC Class Scheduling" },
    { name: "description", content: "Assign subjects to time slots and manage class schedules." },
  ];
}

export default function RegularClassRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <RegularClassPage />
    </RoleGuard>
  );
}

function RegularClassPage() {
  const navigate = useNavigate();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();
  const { context: termContext, selectTerm } = useTermContext();
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [scheduledSets, setScheduledSets] = useState<ScheduledSetOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [clearTarget, setClearTarget] = useState<ScheduledSetOption | null>(null);
  const [unseatedStudents, setUnseatedStudents] = useState<UnseatedIrregularStudent[]>([]);
  const [rooms, setRooms] = useState<ScheduleRoomOption[]>([]);
  const [dayOptions, setDayOptions] = useState<{ id: number; name: string }[]>([]);
  const [editTarget, setEditTarget] = useState<Schedule | null>(null);
  const [editForm, setEditForm] = useState({
    dayName: "",
    startTime: "07:00",
    endTime: "08:00",
    roomId: "",
    mode: "F2F" as Schedule["mode"],
  });
  const [editSaving, setEditSaving] = useState(false);

  // Filters — pin the view to a single section's weekly schedule.
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [setName, setSetName] = useState("");

  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  useEffect(() => {
    scheduleService
      .view()
      .then((result) => {
        setSchedules(result);
        // Default to the newest school year and its first set.
        const years = [...new Set(result.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));
        const firstYear = years[0] ?? "";
        setSchoolYear(firstYear);
        const firstSet = result.find((s) => s.schoolYear === firstYear && s.semester === 1);
        setSetName(firstSet?.setCode ?? "");
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load schedules.");
        setSchedules([]);
      });
  }, []);

  useEffect(() => {
    scheduleService.getSetWithSchedules().then(setScheduledSets).catch(() => setScheduledSets([]));
    scheduleService.listScheduleRooms().then(setRooms).catch(() => setRooms([]));
    enumService.getOptions().then((options) => setDayOptions(options.dayOfWeek)).catch(() => setDayOptions([]));
  }, []);

  const schoolYears = useMemo(
    () => [...new Set((schedules ?? []).map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a)),
    [schedules],
  );

  const availableSets = useMemo(
    () =>
      [
        ...new Set(
          (schedules ?? [])
            .filter((s) => s.schoolYear === schoolYear && s.semester === semester)
            .map((s) => s.setCode),
        ),
      ].sort(),
    [schedules, schoolYear, semester],
  );

  const visibleSchedules = useMemo(() => {
    if (!schedules) return [];
    return schedules
      .filter(
        (s) => s.setCode === setName && s.schoolYear === schoolYear && s.semester === semester,
      )
      .sort(
        (a, b) =>
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
  }, [schedules, setName, schoolYear, semester]);

  const selectedSchoolYearId = useMemo(
    () => termContext?.schoolYears.find((row) => row.schoolYear === schoolYear)?.id ?? null,
    [schoolYear, termContext],
  );

  const selectedScheduledSet = useMemo(
    () =>
      scheduledSets.find(
        (row) =>
          row.setCode === setName &&
          row.schoolYear === schoolYear &&
          row.semesterNumber === semester,
      ) ?? null,
    [scheduledSets, schoolYear, semester, setName],
  );

  useEffect(() => {
    if (!selectedSchoolYearId) return;
    if (
      termContext?.selection.syId === selectedSchoolYearId &&
      termContext.selection.semesterNumber === semester
    ) {
      return;
    }
    void selectTerm(selectedSchoolYearId, semester);
  }, [selectedSchoolYearId, semester, selectTerm, termContext]);

  // Keep the set selection valid when the year/semester filters change.
  useEffect(() => {
    if (setName && !availableSets.includes(setName)) {
      setSetName(availableSets[0] ?? "");
    }
  }, [availableSets, setName]);

  async function handleClearSchedule() {
    if (!clearTarget || !selectedSchoolYearId) return;
    const result = await scheduleService.removeSetSchedules(
      clearTarget.setId,
      selectedSchoolYearId,
      semester,
    );
    if (result.message) toast.success(result.message);
    setUnseatedStudents(result.irregularStudentsUnseated);
    setSchedules((current) =>
      current?.filter(
        (row) =>
          row.setCode !== clearTarget.setCode ||
          row.schoolYear !== schoolYear ||
          row.semester !== semester,
      ) ?? [],
    );
    setScheduledSets((current) =>
      current.filter(
        (row) =>
          row.setId !== clearTarget.setId ||
          row.schoolYear !== schoolYear ||
          row.semesterNumber !== semester,
      ),
    );
    setClearTarget(null);
  }

  function openEdit(schedule: Schedule) {
    setEditTarget(schedule);
    setEditForm({
      dayName: dayOptions.find((option) => DAYS[option.id] === schedule.day)?.name ?? "",
      startTime: formatTime(schedule.startTime),
      endTime: formatTime(schedule.endTime),
      roomId: schedule.roomId,
      mode: schedule.mode,
    });
    setActionError(null);
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    setActionError(null);
    try {
      const message = await scheduleService.updateRegular(Number(editTarget.id), {
        dayOfWeek: editForm.dayName,
        startTime: formatTime(editForm.startTime),
        endTime: formatTime(editForm.endTime),
        roomId: editForm.roomId ? Number(editForm.roomId) : null,
        mode: editForm.mode,
      });
      if (message) toast.success(message);
      setSchedules((current) =>
        current?.map((row) =>
          row.id === editTarget.id
            ? {
                ...row,
                day: DAYS[dayOptions.find((option) => option.name === editForm.dayName)?.id ?? 0],
                startTime: parseTime12h(editForm.startTime),
                endTime: parseTime12h(editForm.endTime),
                roomId: editForm.roomId,
                roomName: rooms.find((room) => String(room.id) === editForm.roomId)?.roomName ?? row.roomName,
                mode: editForm.mode,
              }
            : row,
        ) ?? [],
      );
      setEditTarget(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update schedule.");
    } finally {
      setEditSaving(false);
    }
  }

  const isLoading = schedules === null;
  // Filters only make sense once there's at least one schedule to show.
  const showContent = !loadError && !isLoading && (schedules?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Regular Schedule Builder"
        description="Class schedules for the current academic term."
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            {selectedScheduledSet && (
              <Button
                type="button"
                variant="outline"
                block={false}
                onClick={() => setClearTarget(selectedScheduledSet)}
              >
                <TrashIcon />
                Clear Schedule
              </Button>
            )}
            <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
              <PlusIcon />
              Create Schedule
            </Button>
          </div>
        }
      />

      {/* Filters */}
      {showContent && (
        <div className="mt-4 flex flex-col gap-4">
          <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          <FieldChrome id="rc-school-year" label="School Year">
            <Select
              items={
                isLoading
                  ? [{ value: "", label: "Loading…" }]
                  : schoolYears.length === 0
                    ? [{ value: "", label: "No school year" }]
                    : schoolYears.map((y) => ({ value: y, label: y }))
              }
              value={schoolYear}
              onValueChange={(v) => setSchoolYear(v as string)}
            >
              <SelectTrigger id="rc-school-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="">Loading…</SelectItem>
                ) : schoolYears.length === 0 ? (
                  <SelectItem value="">No school year</SelectItem>
                ) : (
                  schoolYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="rc-semester" label="Semester">
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
              value={semestersLoading ? "" : String(semester)}
              onValueChange={(v) => setSemester(Number(v) as ScheduleSemester)}
            >
              <SelectTrigger id="rc-semester">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {semestersLoading ? (
                  <SelectItem value="">Loading…</SelectItem>
                ) : semesters.length === 0 ? (
                  <SelectItem value="">No semester</SelectItem>
                ) : (
                  semesters.filter((s) => s.semesterNumber !== 3).map((s) => (
                    <SelectItem key={s.id} value={String(s.semesterNumber)}>
                      {semesterLabel(s.semesterNumber)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="rc-set" label="Set">
            <Select
              items={[
                {
                  value: "",
                  label: isLoading ? "Loading…" : availableSets.length === 0 ? "No set" : "Select a set",
                },
                ...availableSets.map((s) => ({ value: s, label: s })),
              ]}
              value={setName}
              onValueChange={(v) => setSetName(v as string)}
            >
              <SelectTrigger id="rc-set">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  {isLoading ? "Loading…" : availableSets.length === 0 ? "No set" : "Select a set"}
                </SelectItem>
                {availableSets.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
        </Card>
        </div>
      )}

      {/* View toggle + print */}
      {showContent && (
        <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="hidden sm:block" />
          <div className="flex justify-center">
            <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={visibleSchedules.length === 0}
              onClick={() =>
                openSchedulePrint(visibleSchedules, { schoolYear, semesterLabel: semesterLabel(semester) })
              }
            >
              <PrinterIcon />
              Print
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <AnimatePresence>
          {actionError && (
            <Alert key="action-error" variant="destructive" className="mb-4">
              <AlertIcon />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          {loadError && (
            <Alert key="load-error" variant="destructive" className="mb-4">
              <AlertIcon />
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}
        </AnimatePresence>

        {loadError ? null : isLoading ? (
          <div
            role="status"
            aria-label="Loading schedules"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleSchedules.length === 0 ? (
          <EmptyState
            title="No schedules found"
            action={
              <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
                <PlusIcon />
                Create Schedule
              </Button>
            }
          >
            No schedules match the current filters. Create a schedule to get started.
          </EmptyState>
        ) : viewMode === "grid" ? (
          <ScheduleGrid schedules={visibleSchedules} onEdit={openEdit} />
        ) : (
          <ScheduleTable schedules={visibleSchedules} onEdit={openEdit} />
        )}
      </div>

      <Modal
        open={editTarget !== null}
        onClose={() => {
          if (!editSaving) setEditTarget(null);
        }}
        title={`Edit ${editTarget?.subjectCode ?? "schedule"}`}
      >
        <form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
          <p className="font-body text-sm text-slate-600 dark:text-slate-300">
            Update the saved class placement. The backend will validate conflicts and room rules.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldChrome id="edit-day" label="Day">
              <Select
                items={dayOptions.map((option) => ({ value: option.name, label: option.name }))}
                value={editForm.dayName}
                onValueChange={(value) => setEditForm((current) => ({ ...current, dayName: value as string }))}
              >
                <SelectTrigger id="edit-day"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dayOptions.map((option) => (
                    <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="edit-mode" label="Mode">
              <Select
                items={SCHEDULE_MODES.map((mode) => ({ value: mode, label: mode }))}
                value={editForm.mode}
                onValueChange={(value) => setEditForm((current) => ({ ...current, mode: value as Schedule["mode"] }))}
              >
                <SelectTrigger id="edit-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEDULE_MODES.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="edit-start-time" label="Start time">
              <Select
                items={TIME_OPTIONS.map((time) => ({ value: time, label: time }))}
                value={editForm.startTime}
                onValueChange={(value) => setEditForm((current) => ({ ...current, startTime: value as string }))}
              >
                <SelectTrigger id="edit-start-time"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="edit-end-time" label="End time">
              <Select
                items={TIME_OPTIONS.filter((time) => timeToMinutes(time) > timeToMinutes(editForm.startTime)).map((time) => ({ value: time, label: time }))}
                value={editForm.endTime}
                onValueChange={(value) => setEditForm((current) => ({ ...current, endTime: value as string }))}
              >
                <SelectTrigger id="edit-end-time"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.filter((time) => timeToMinutes(time) > timeToMinutes(editForm.startTime)).map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </div>
          <FieldChrome id="edit-room" label="Room">
            <Select
              items={rooms.map((room) => ({ value: String(room.id), label: `${room.roomName} (${room.buildingName})` }))}
              value={editForm.roomId}
              onValueChange={(value) => setEditForm((current) => ({ ...current, roomId: value as string }))}
            >
              <SelectTrigger id="edit-room"><SelectValue placeholder="Select a room" /></SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={String(room.id)}>{room.roomName} ({room.buildingName})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" block={false} disabled={editSaving} onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" block={false} isLoading={editSaving} loadingLabel="Saving…">
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={clearTarget !== null}
        onClose={() => setClearTarget(null)}
        title="Clear set schedule"
        confirmLabel="Clear schedule"
        loadingLabel="Clearing…"
        confirmVariant="danger"
        onConfirm={handleClearSchedule}
      >
        Clear the complete {clearTarget?.setCode} schedule for S.Y. {schoolYear}, {semesterLabel(semester)}?
        Instructor and subject hour ledgers will be released with the saved sessions.
      </ConfirmDialog>

      <Modal
        open={unseatedStudents.length > 0}
        onClose={() => setUnseatedStudents([])}
        title="Irregular students unseated"
      >
        <div className="flex flex-col gap-4">
          <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Clearing the set removed these students from borrowed class offerings. They now need to be seated again.
          </p>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {unseatedStudents.map((student) => (
              <li key={student.studentProfileId} className="px-3 py-2 font-body text-sm">
                <span className="font-medium text-navy-700 dark:text-mist-100">{student.name}</span>
                {student.studentId && (
                  <span className="ml-2 text-slate-500 dark:text-slate-400">{student.studentId}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button type="button" block={false} onClick={() => setUnseatedStudents([])}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
