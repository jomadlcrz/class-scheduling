import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Card } from "~/components/ui/card";
import { Drawer } from "~/components/ui/drawer";
import { ListIcon, LockIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { AdjustmentBoardEditor } from "~/features/schedules/adjustment-board-editor";
import { AdjustmentBoardMap } from "~/features/schedules/adjustment-board-map";
import { AutoGenerateIcon } from "~/features/schedules/schedule-generator";
import {
  AdjustmentUnplacedPanel,
  setIsComplete,
  type PlacementDraft,
} from "~/features/schedules/adjustment-unplaced-panel";
import { SchedulingHubNav } from "~/features/schedules/scheduling-hub-nav";
import type { MajorTimetableSlot } from "~/features/schedules/major-scheduling-timetable-selection";
import { useCachedData } from "~/hooks/use-cached-data";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { useTermClosures } from "~/hooks/use-term-closures";
import { PageHeader } from "~/layouts/page-header";
import { reportRequestError } from "~/lib/form-error-summary";
import { timeToMinutes } from "~/lib/time";
import { buildingService } from "~/services/building.service";
import { scheduleAdjustmentService } from "~/services/schedule-adjustment.service";
import {
  scheduleService,
  type ScheduleFacultyOption,
  type ScheduleSubjectOption,
} from "~/services/schedule.service";
import type { Day } from "~/types/schedule";
import type {
  AdjustmentBoard,
  AdjustmentMeeting,
  AdjustmentRoom,
  AdjustmentSet,
} from "~/types/schedule-adjustment";

const DAY_BY_LABEL: Record<string, Day> = {
  Monday: "M",
  Tuesday: "T",
  Wednesday: "W",
  Thursday: "Th",
  Friday: "F",
  Saturday: "S",
};

export function AdjustmentBoardPage() {
  const { context: termContext, selectTerm } = useTermContext();
  const { schoolYears, loading: syLoading } = useSchoolYears();
  const { semesters, loading: semLoading } = useSemesters();
  const { closures } = useTermClosures();

  const syId = termContext?.selection.syId ?? schoolYears[0]?.id ?? null;
  const semesterNumber = termContext?.selection.semesterNumber ?? semesters[0]?.semesterNumber ?? null;
  const schoolYearLabel = termContext?.selection.schoolYear ?? schoolYears.find((s) => s.id === syId)?.schoolYear;

  const termClosed = useMemo(() => {
    if (syId == null || semesterNumber == null) return false;
    return closures.some((c) => c.syId === syId && c.semesterNumber === semesterNumber && c.status === "Closed");
  }, [closures, syId, semesterNumber]);

  // ---- filters ------------------------------------------------------------
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");

  const { data: buildingsData } = useCachedData("buildings:list", () => buildingService.list());
  const buildings = buildingsData ?? [];

  const boardKey =
    syId != null && semesterNumber != null
      ? `adjustment-board:${syId}:${semesterNumber}:${departmentFilter}:${programFilter}:${buildingFilter}:${roomFilter}`
      : "";

  const {
    data: board,
    isValidating: boardLoading,
    reload: refetchBoard,
  } = useCachedData<AdjustmentBoard>(
    boardKey,
    () =>
      scheduleAdjustmentService.getBoard({
        syId: syId!,
        semesterNumber: semesterNumber!,
        departmentId: departmentFilter === "all" ? null : Number(departmentFilter),
        programId: programFilter === "all" ? null : Number(programFilter),
        buildingId: buildingFilter === "all" ? null : Number(buildingFilter),
        roomId: roomFilter === "all" ? null : Number(roomFilter),
      }),
    { enabled: Boolean(syId && semesterNumber) },
  );

  const scopeKey =
    syId != null && semesterNumber != null ? `adjustment-board-scope:${syId}:${semesterNumber}` : "";
  const { data: scopeBoard } = useCachedData<AdjustmentBoard>(
    scopeKey,
    () => scheduleAdjustmentService.getBoard({ syId: syId!, semesterNumber: semesterNumber! }),
    { enabled: Boolean(syId && semesterNumber) },
  );

  const departments = useMemo(() => {
    const rows = new Map<number, string>();
    for (const set of scopeBoard?.sets ?? []) {
      if (set.departmentId != null) rows.set(set.departmentId, set.departmentAbbrev ?? "—");
    }
    return [...rows.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [scopeBoard]);

  const programs = useMemo(() => {
    const rows = new Map<number, string>();
    for (const set of scopeBoard?.sets ?? []) {
      if (departmentFilter !== "all" && String(set.departmentId) !== departmentFilter) continue;
      rows.set(set.programId, set.programAbbrev ?? "—");
    }
    return [...rows.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [scopeBoard, departmentFilter]);

  const roomOptions = useMemo(
    () =>
      buildingFilter === "all"
        ? []
        : (scopeBoard?.rooms ?? []).filter((room: AdjustmentRoom) => String(room.buildingId) === buildingFilter),
    [scopeBoard, buildingFilter],
  );

  // ---- selection ----------------------------------------------------------
  const [pickedUp, setPickedUp] = useState<AdjustmentMeeting | null>(null);
  const [slot, setSlot] = useState<MajorTimetableSlot | null>(null);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [placementProgramId, setPlacementProgramId] = useState<number | null>(null);
  const [placementSetId, setPlacementSetId] = useState<number | null>(null);
  const [placementSubjectId, setPlacementSubjectId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<PlacementDraft[]>([]);
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [savingSetId, setSavingSetId] = useState<number | null>(null);
  const [workOpen, setWorkOpen] = useState(false);

  const meetings = board?.meetings ?? [];
  const rooms = board?.rooms ?? [];
  const sets = board?.sets ?? [];
  const placementSet = sets.find((set: AdjustmentSet) => set.setId === placementSetId) ?? null;
  const placementSubject =
    placementSet?.unplaced.find((subject) => subject.subjectId === placementSubjectId) ?? null;

  const clearSelection = useCallback(() => {
    setPickedUp(null);
    setSlot(null);
    setPlacementOpen(false);
    setPlacementProgramId(null);
    setPlacementSetId(null);
    setPlacementSubjectId(null);
    setFacultyId(null);
    setEditorError(null);
  }, []);

  useEffect(() => {
    clearSelection();
  }, [departmentFilter, programFilter, buildingFilter, roomFilter, syId, semesterNumber, clearSelection]);

  const draftMeetings = useMemo<AdjustmentMeeting[]>(
    () =>
      drafts.map((draft, index) => {
        const foundSet = sets.find((s: AdjustmentSet) => s.setId === draft.setId);
        return {
          id: -(index + 1),
          syId: syId ?? 0,
          semesterNumber: semesterNumber ?? 0,
          programId: draft.programId,
          programAbbrev: foundSet?.programAbbrev ?? null,
          departmentId: foundSet?.departmentId ?? null,
          departmentAbbrev: foundSet?.departmentAbbrev ?? null,
          setId: draft.setId,
          setName: foundSet?.setName ?? null,
          yearLevel: foundSet?.yearLevel ?? null,
          subjectId: draft.subjectId,
          subjectCode: `${draft.subjectCode} (staged)`,
          subjectTitle: draft.subjectCode,
          subjectType: draft.subjectType,
          classMode: draft.classMode,
          sessionMode: draft.sessionMode,
          instructorId: draft.instructorId,
          instructorName: draft.instructorName,
          roomId: draft.roomId,
          roomName: draft.roomName,
          dayOfWeek: draft.dayOfWeek,
          startTime: draft.startTime,
          endTime: draft.endTime,
          locked: true,
          lockReason: "Staged — not saved yet.",
          editable: false,
          origin: "staged",
          isDeanMajor: false,
        };
      }),
    [drafts, sets, syId, semesterNumber],
  );

  const drawnMeetings = useMemo(
    () => [...meetings, ...draftMeetings],
    [meetings, draftMeetings],
  );

  const conflictMeetingIds = useMemo(() => {
    const conflicts = new Set<number>();
    const byTrack = new Map<string, AdjustmentMeeting[]>();
    for (const meeting of drawnMeetings) {
      if (meeting.roomId == null || !meeting.dayOfWeek) continue;
      const key = `${meeting.roomId}:${meeting.dayOfWeek}`;
      const list = byTrack.get(key) ?? [];
      byTrack.set(key, list);
      list.push(meeting);
    }
    for (const list of byTrack.values()) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          if (
            timeToMinutes(a.startTime ?? "") < timeToMinutes(b.endTime ?? "") &&
            timeToMinutes(b.startTime ?? "") < timeToMinutes(a.endTime ?? "")
          ) {
            conflicts.add(a.id);
            conflicts.add(b.id);
          }
        }
      }
    }
    return conflicts;
  }, [drawnMeetings]);

  // ---- instructors for the subject chosen after selecting a free slot -----
  const [subjectOptions, setSubjectOptions] = useState<ScheduleSubjectOption[]>([]);

  useEffect(() => {
    if (!placementSet || !placementSubject || !schoolYearLabel || semesterNumber == null) {
      setSubjectOptions([]);
      return;
    }
    let cancelled = false;
    scheduleService
      .listScheduleSubjects({
        schoolYear: schoolYearLabel,
        programId: placementSet.programId,
        semester: semesterNumber,
        yearLevel: placementSet.yearLevel,
        includeScheduledSets: true,
      })
      .then((rows) => {
        if (!cancelled) setSubjectOptions(rows);
      })
      .catch(() => {
        if (!cancelled) setSubjectOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [placementSet, placementSubject, schoolYearLabel, semesterNumber]);

  const faculties = useMemo<ScheduleFacultyOption[]>(
    () => subjectOptions.find((s) => s.id === placementSubject?.subjectId)?.faculties ?? [],
    [subjectOptions, placementSubject],
  );

  const destinationRoom = useMemo(
    () => (slot ? (rooms.find((room: AdjustmentRoom) => room.id === slot.roomId) ?? null) : null),
    [rooms, slot],
  );

  // ---- actions ------------------------------------------------------------
  function pickUpMeeting(meeting: AdjustmentMeeting) {
    if (termClosed && meeting.id > 0) {
      toast.error("This term is closed. Its schedules are a permanent record.");
      return;
    }
    setEditorError(null);
    setSlot(null);
    setPlacementOpen(false);
    setPlacementProgramId(null);
    setPlacementSetId(null);
    setPlacementSubjectId(null);
    if (meeting.id < 0) {
      setDrafts((current) => current.filter((_, index) => -(index + 1) !== meeting.id));
      setPickedUp(null);
      return;
    }
    if (!meeting.editable) {
      setPickedUp(null);
      toast.error(meeting.lockReason ?? "This meeting cannot be moved.");
      return;
    }
    setPickedUp((current) => (current?.id === meeting.id ? null : meeting));
  }

  function choosePlacementProgram(programId: number | null) {
    setEditorError(null);
    setPlacementProgramId(programId);
    setPlacementSetId(null);
    setPlacementSubjectId(null);
    setFacultyId(null);
  }

  function choosePlacementSet(setId: number | null) {
    setEditorError(null);
    setPlacementSetId(setId);
    setPlacementSubjectId(null);
    setFacultyId(null);
  }

  function choosePlacementSubject(subjectId: number | null) {
    setEditorError(null);
    setPlacementSubjectId(subjectId);
    setFacultyId(null);
  }

  function selectFreeSlot(next: MajorTimetableSlot) {
    setSlot(next);
    setEditorError(null);
    if (pickedUp) return;
    setPlacementOpen(false);
    setPlacementProgramId(null);
    setPlacementSetId(null);
    setPlacementSubjectId(null);
    setFacultyId(null);
  }

  function completeFreeSlot(next: MajorTimetableSlot) {
    selectFreeSlot(next);
    if (!pickedUp) setPlacementOpen(true);
  }

  function clearFreeSlotSelection() {
    setSlot(null);
    setPlacementOpen(false);
    setPlacementProgramId(null);
    setPlacementSetId(null);
    setPlacementSubjectId(null);
    setFacultyId(null);
    setEditorError(null);
  }

  async function commitMove() {
    if (!pickedUp || !slot) return;
    if (termClosed) {
      setEditorError("This term is closed. Its schedules cannot be moved.");
      return;
    }
    if (slot.roomId < 0) {
      setEditorError(
        "A class cannot be moved onto a class-mode track here — this only changes day, time and room. Change how it is delivered from Generate Schedule.",
      );
      return;
    }
    setMoving(true);
    setEditorError(null);
    try {
      const message = await scheduleService.updateRegularSlot(pickedUp.id, {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomId: slot.roomId,
      });
      toast.success(message || "Schedule moved successfully.");
      clearSelection();
      await refetchBoard();
    } catch (err) {
      reportRequestError(err, setEditorError, "Unable to move this class.");
    } finally {
      setMoving(false);
    }
  }

  function stagePlacement() {
    if (!placementSet || !placementSubject || !slot) return;
    if (termClosed) {
      setEditorError("This term is closed. Its schedules cannot be changed.");
      return;
    }
    if (slot.roomId < 0) {
      setEditorError(
        "A staged placement needs a real room. Place this class in a room, or set its class mode from Generate Schedule.",
      );
      return;
    }
    const room = rooms.find((r: AdjustmentRoom) => r.id === slot.roomId) ?? null;
    const sessionMode: "LEC" | "LAB" = room?.type === "Laboratory" ? "LAB" : "LEC";

    if (room && room.programIds.length > 0 && !room.programIds.includes(placementSet.programId)) {
      setEditorError(
        `${room.name} is not available to ${placementSet.programAbbrev}. Choose a room this program may use.`,
      );
      return;
    }
    const faculty = faculties.find((f) => f.id === facultyId) ?? null;
    setDrafts((current) => [
      ...current,
      {
        draftId: `${placementSet.setId}:${placementSubject.subjectId}:${current.length}`,
        setId: placementSet.setId,
        programId: placementSet.programId,
        subjectId: placementSubject.subjectId,
        subjectCode: placementSubject.subjectCode,
        subjectType: placementSubject.subjectType,
        sessionMode,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomId: slot.roomId,
        roomName: room?.name ?? null,
        classMode: "F2F",
        instructorId: facultyId,
        instructorName: faculty?.fullName ?? "TBA",
      },
    ]);
    setSlot(null);
    setPlacementOpen(false);
    setPlacementProgramId(null);
    setPlacementSetId(null);
    setPlacementSubjectId(null);
    setFacultyId(null);
    setEditorError(null);
  }

  async function saveSet(set: AdjustmentSet) {
    const pending = drafts.filter((draft) => draft.setId === set.setId);
    if (pending.length === 0 || !schoolYearLabel || semesterNumber == null) return;
    if (termClosed) {
      toast.error("This term is closed. Its schedules cannot be changed.");
      return;
    }
    setSavingSetId(set.setId);
    try {
      const result = await scheduleService.createRegular({
        schoolYear: schoolYearLabel,
        semester: semesterNumber as 1 | 2,
        programId: set.programId,
        setId: set.setId,
        slots: pending.map((draft) => ({
          day: DAY_BY_LABEL[draft.dayOfWeek] ?? "M",
          startTime: draft.startTime,
          endTime: draft.endTime,
          subjectId: draft.subjectId,
          mode: draft.classMode,
          sessionMode: draft.sessionMode,
          facultyId: draft.instructorId ?? 0,
          facultyName: draft.instructorName,
          roomId: draft.roomId,
        })),
      });
      toast.success(result.message || `${set.setName} saved.`);
      for (const note of result.rescheduled ?? []) toast.message(note);
      setDrafts((current) => current.filter((draft) => draft.setId !== set.setId));
      clearSelection();
      await refetchBoard();
    } catch (err) {
      reportRequestError(err, undefined, `Unable to save ${set.setName}.`);
    } finally {
      setSavingSetId(null);
    }
  }

  // ---- render -------------------------------------------------------------
  const isBootstrapping = syLoading || semLoading;
  if (isBootstrapping) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  const editor = pickedUp ? (
    <AdjustmentBoardEditor
      kind="move"
      termClosed={termClosed}
      meeting={pickedUp}
      destination={slot}
      destinationRoom={destinationRoom}
      error={editorError}
      submitting={moving}
      onSubmit={commitMove}
      onCancel={clearSelection}
    />
  ) : null;

  const sectionsNeedingWork = sets.filter((set: AdjustmentSet) => set.unplaced.length > 0).length;
  const readyToSave = sets.filter((set: AdjustmentSet) => {
    const staged = drafts.filter((draft) => draft.setId === set.setId);
    return staged.length > 0 && setIsComplete(set, staged);
  }).length;

  function renderWorkPanel() {
    return (
      <AdjustmentUnplacedPanel
        sets={sets}
        drafts={drafts}
        onSaveSet={saveSet}
        onDiscardSetDrafts={(setId) =>
          setDrafts((current) => current.filter((draft) => draft.setId !== setId))
        }
        savingSetId={savingSetId}
        searchId="placement-queue-drawer-search"
      />
    );
  }

  const boardSummary = (
    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
      <Link
        to="/schedules/new"
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-200"
      >
        <AutoGenerateIcon />
        Generate schedules
      </Link>
      <button
        type="button"
        aria-expanded={workOpen}
        onClick={() => setWorkOpen((open) => !open)}
        className={[
          "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-body text-xs font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400",
          readyToSave > 0
            ? "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            : "border border-slate-300 text-navy-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10",
        ].join(" ")}
      >
        <span aria-hidden="true"><ListIcon /></span>
        <span>Placement queue</span>
        <span
          className={[
            "rounded-md px-1.5 py-0.5 font-body text-[0.625rem] font-semibold leading-none tabular-nums",
            readyToSave > 0
              ? "bg-white/20 text-white dark:bg-navy-950/20"
              : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200",
          ].join(" ")}
        >
          {readyToSave > 0
            ? `${readyToSave} ready`
            : drafts.length > 0
              ? `${drafts.length} staged`
              : sectionsNeedingWork}
        </span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <PageHeader
        title="Schedule Adjustment Board"
        actions={
          <div className="flex items-center gap-3">
            <Select
              items={schoolYears.map((sy) => ({ value: String(sy.id), label: sy.schoolYear }))}
              value={syId ? String(syId) : ""}
              onValueChange={(val) => {
                if (val && semesterNumber != null) {
                  void selectTerm(Number(val), semesterNumber);
                }
              }}
            >
              <SelectTrigger id="term-sy-select">
                <SelectValue placeholder="Select school year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((sy) => (
                  <SelectItem key={sy.id} value={String(sy.id)}>
                    {sy.schoolYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              items={semesters.map((sem) => ({
                value: String(sem.semesterNumber),
                label: `Semester ${sem.semesterNumber}`,
              }))}
              value={semesterNumber != null ? String(semesterNumber) : ""}
              onValueChange={(val) => {
                if (val && syId != null) {
                  void selectTerm(syId, Number(val));
                }
              }}
            >
              <SelectTrigger id="term-sem-select">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem.semesterNumber} value={String(sem.semesterNumber)}>
                    Semester {sem.semesterNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <SchedulingHubNav />

      {termClosed ? (
        <p className="mt-1 flex items-start gap-1.5 font-body text-xs leading-snug text-amber-800 dark:text-amber-100/90">
          <span className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-200" aria-hidden="true">
            <LockIcon size={12} />
          </span>
          <span>This academic term is closed. Schedules are read-only.</span>
        </p>
      ) : null}

      <Card className="grid gap-3 p-3 sm:p-4 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Department</span>
          <Select
            items={[
              { value: "all", label: "All departments" },
              ...departments.map(([id, abbrev]) => ({ value: String(id), label: abbrev })),
            ]}
            value={departmentFilter}
            onValueChange={(value) => {
              setDepartmentFilter(value as string);
              setProgramFilter("all");
            }}
          >
            <SelectTrigger id="ab-department" aria-label="Department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map(([id, abbrev]) => (
                <SelectItem key={id} value={String(id)}>
                  {abbrev}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Program</span>
          <Select
            items={[
              { value: "all", label: "All programs" },
              ...programs.map(([id, abbrev]) => ({ value: String(id), label: abbrev })),
            ]}
            value={programFilter}
            onValueChange={(value) => setProgramFilter(value as string)}
          >
            <SelectTrigger id="ab-program" aria-label="Program">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map(([id, abbrev]) => (
                <SelectItem key={id} value={String(id)}>
                  {abbrev}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Building</span>
          <Select
            items={[
              { value: "all", label: "All buildings" },
              ...buildings.map((building: { id: number; name: string }) => ({
                value: String(building.id),
                label: building.name,
              })),
            ]}
            value={buildingFilter}
            onValueChange={(value) => {
              setBuildingFilter(value as string);
              setRoomFilter("all");
            }}
          >
            <SelectTrigger id="ab-building" aria-label="Building">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buildings</SelectItem>
              {buildings.map((building: { id: number; name: string }) => (
                <SelectItem key={building.id} value={String(building.id)}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Room</span>
          <Select
            items={[
              { value: "all", label: "All rooms" },
              ...roomOptions.map((room: AdjustmentRoom) => ({ value: String(room.id), label: room.name })),
            ]}
            value={roomFilter}
            onValueChange={(value) => setRoomFilter(value as string)}
            disabled={buildingFilter === "all"}
          >
            <SelectTrigger
              id="ab-room"
              aria-label="Room"
              disabled={buildingFilter === "all"}
            >
              <SelectValue placeholder="Select a building first" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rooms</SelectItem>
              {roomOptions.map((room: AdjustmentRoom) => (
                <SelectItem key={room.id} value={String(room.id)}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {boardLoading && !board ? (
        <div className="flex min-h-[300px] items-center justify-center p-8">
          <Spinner />
        </div>
      ) : (
        <div className="min-w-0">
          <AdjustmentBoardMap
            rooms={rooms}
            meetings={drawnMeetings}
            labTimeSlots={board?.labTimeSlots ?? []}
            selectedMeetingId={pickedUp?.id ?? null}
            onMeetingSelect={pickUpMeeting}
            activeSlotSelection={slot}
            conflictMeetingIds={conflictMeetingIds}
            onFreeSlotClick={selectFreeSlot}
            onSelectionChange={selectFreeSlot}
            onSelectionClear={clearFreeSlotSelection}
            onShiftSelectionComplete={completeFreeSlot}
            editor={editor}
            headerControls={boardSummary}
            helperText={
              pickedUp
                ? `Moving ${pickedUp.subjectCode}. Click a free cell for its new slot; hold Shift to make the block longer.`
                : "Select a free cell, then hold Shift and click or drag to extend it. Release Shift to choose the program, section, subject, and instructor."
            }
          />
        </div>
      )}

      <Drawer
        open={workOpen}
        onClose={() => {
          if (savingSetId == null) setWorkOpen(false);
        }}
        title="Placement queue"
        description={`${sectionsNeedingWork} section${sectionsNeedingWork === 1 ? "" : "s"} need placement. Review what is missing here, then select a free timetable range to place it.`}
        wide
      >
        {renderWorkPanel()}
      </Drawer>

      <Modal
        open={placementOpen && slot != null && pickedUp == null}
        onClose={clearSelection}
        title="Schedule details"
      >
        {slot ? (
          <AdjustmentBoardEditor
            kind="place"
            termClosed={termClosed}
            sets={sets}
            drafts={drafts}
            programId={placementProgramId}
            onProgramChange={choosePlacementProgram}
            setId={placementSetId}
            onSetChange={choosePlacementSet}
            subjectId={placementSubjectId}
            onSubjectChange={choosePlacementSubject}
            destination={slot}
            destinationRoom={destinationRoom}
            faculties={faculties}
            facultyId={facultyId}
            onFacultyChange={setFacultyId}
            error={editorError}
            onSubmit={stagePlacement}
            onCancel={clearSelection}
          />
        ) : null}
      </Modal>
    </div>
  );
}
