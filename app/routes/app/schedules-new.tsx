import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Drawer } from "~/components/ui/drawer";
import { AlertIcon, PlusIcon, RefreshCwIcon, RotateIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { ScheduleBuilderSkeleton } from "~/components/ui/skeleton";
import { ScheduleContextForm } from "~/features/schedules/schedule-context-form";
import {
  AutoGenerateIcon,
  GenerationConflictsAlert,
  useAutoGenerate,
} from "~/features/schedules/schedule-generator";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { SlotEntryForm, type PendingSlot } from "~/features/schedules/slot-entry-form";
import { useCachedData } from "~/hooks/use-cached-data";
import { useDays } from "~/hooks/use-days";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { ApiError } from "~/lib/api";
import { programService } from "~/services/program.service";
import type { ScheduleSuggestion } from "~/services/schedule.service";
import {
  scheduleService,
  type ScheduleRoomOption,
  type ScheduleSubjectOption,
  type ScheduleYearLevelOption,
} from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import { weeklyHourService } from "~/services/weekly-hour-allocation.service";

import { formatDecimalHour, normalizeTime, timeToMinutes } from "~/lib/time";
import type { Program } from "~/types/program";
import {
  DAY_LABELS,
  formatTime,
  type Day,
  type Schedule,
  type ScheduleMode,
  type ScheduleSemester,
} from "~/types/schedule";
import type { ClassSet } from "~/types/set";
import type { YearLevel } from "~/types/subject";
import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";


export function meta() {
  return [
    { title: "New Schedule — GWC Class Scheduling" },
    { name: "description", content: "Build a week schedule for a set." },
  ];
}

const DAY_LABEL_TO_KEY: Record<string, Day> = {
  Monday: "M", Tuesday: "T", Wednesday: "W", Thursday: "Th", Friday: "F", Saturday: "S",
};

/**
 * Parse a backend conflict string to extract both the current (from) and
 * target (to) position of the slot that should be moved.
 * e.g. "moving CC102 (BSIT-1E) from Thursday 3:30 PM to Friday 8:00 AM (COMPUTER LAB 1)"
 */
function parseConflictSlot(text: string): {
  subjectCode: string;
  setCode: string;
  fromDay: Day;
  fromStartTime: string;
  toDay: Day;
  toStartTime: string;
  toRoomName: string;
} | null {
  const moveMatch = text.match(
    /moving\s+([A-Z]{2,8}\d{1,4})\s*\(([^)]+)\)\s+from\s+(\w+)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s+to\s+(\w+)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*\(([^)]+)\)/i,
  );
  if (!moveMatch) return null;
  const fromDayKey = DAY_LABEL_TO_KEY[moveMatch[3]];
  const toDayKey = DAY_LABEL_TO_KEY[moveMatch[5]];
  if (!fromDayKey || !toDayKey) return null;
  return {
    subjectCode: moveMatch[1],
    setCode: moveMatch[2],
    fromDay: fromDayKey,
    fromStartTime: normalizeTime(moveMatch[4]),
    toDay: toDayKey,
    toStartTime: normalizeTime(moveMatch[6]),
    toRoomName: moveMatch[7],
  };
}

export default function SchedulesNew() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <SchedulesNewPage />
    </RoleGuard>
  );
}

function SchedulesNewPage() {
  const navigate = useNavigate();
  const { semesters, semesterLabel } = useSemesters();
  const { schoolYears, defaultSchoolYear, loading: schoolYearsLoading } = useSchoolYears();
  const { dayLabels } = useDays();

  // Sourced from the schedule-scoped GET /regular_schedule/create-regular-class-schedules
  // rather than the general year-level enum, so the label sent to auto-generate always
  // matches this module's own vocabulary (YEAR_LEVEL_INT_TO_NAME on the backend).
  const { data: creationContext } = useCachedData("schedule-creation-context", () =>
    scheduleService.getCreationContext(),
  );
  const yearLevels = useMemo(() => creationContext?.yearLevels ?? [], [creationContext]);
  const yearLevelIds = useMemo(() => yearLevels.map((yl) => yl.id), [yearLevels]);
  const yearLevelLabelMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const yl of yearLevels) m.set(yl.id, yl.name);
    return m;
  }, [yearLevels]);
  const yearLevelLabel = useCallback(
    (n: number) => yearLevelLabelMap.get(n) ?? `${n}th Year`,
    [yearLevelLabelMap],
  );

  const { data: programs } = useCachedData("programs", () => programService.list());
  const [sets, setSets] = useState<ClassSet[]>([]);
  const { data: roomsData } = useCachedData("schedule-rooms", () =>
    scheduleService.listScheduleRooms(),
  );
  const rooms = roomsData ?? [];
  const [subjects, setSubjects] = useState<ScheduleSubjectOption[]>([]);
  const { data: allocations } = useCachedData("weekly-hour-allocations", () =>
    weeklyHourService.list(),
  );

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | "">("");
  const [selectedSetId, setSelectedSetId] = useState("");

  const [slots, setSlots] = useState<PendingSlot[]>([]);
  const [editing, setEditing] = useState<PendingSlot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conflictPrefill, setConflictPrefill] = useState<{
    subjectCode: string;
    day: Day;
    startTime: string;
    endTime: string;
    roomName: string;
    facultyName?: string;
    slotTempId?: string;
    savedScheduleId?: string;
  } | null>(null);
  const [conflictSubjects, setConflictSubjects] = useState<ScheduleSubjectOption[] | null>(null);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [pendingMove, setPendingMove] = useState<ScheduleSuggestion | null>(null);
  // "instructorId:DayName" keys accepted from confirm_daily_hour_increase cards this
  // session — sent on every subsequent generate/regenerate so the confirm sticks.
  const [confirmedDailyHourIncreases, setConfirmedDailyHourIncreases] = useState<string[]>([]);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ledgerDriftCount, setLedgerDriftCount] = useState<number | null>(null);
  const [checkingLedgers, setCheckingLedgers] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const {
    isGenerating,
    hasGenerated,
    conflicts: generationConflicts,
    suggestions: generationSuggestions,
    resolution: generationResolution,
    generate,
    reset: resetGeneration,
  } = useAutoGenerate();
  const tempIdCounter = useRef(0);

  const isDirty = slots.length > 0 || isGenerating;
  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  // Default to the most recent school year once the list loads; a manual pick isn't overridden.
  useEffect(() => {
    if (schoolYear || schoolYears.length === 0) return;
    setSchoolYear(defaultSchoolYear);
  }, [schoolYear, schoolYears, defaultSchoolYear]);

  // Re-fetch sets whenever the context changes so already-scheduled sets are excluded.
  const matchedSy = schoolYears.find((s) => s.schoolYear === schoolYear);
  const matchedSem = semesters.find((s) => s.semesterNumber === semester);
  useEffect(() => {
    if (!matchedSy || !matchedSem || !selectedProgramId) return;
    setSets([]);
    setService
      .listUnscheduled({
        syId: matchedSy.id,
        semesterNumber: matchedSem.semesterNumber,
        programId: Number(selectedProgramId),
      })
      .then(setSets)
      .catch(() => setSets([]));
  }, [matchedSy?.id, matchedSem?.semesterNumber, selectedProgramId]);

  const selectedProgram = programs?.find((p) => String(p.id) === selectedProgramId);
  const selectedSet = sets.find((s) => String(s.id) === selectedSetId);
  const schoolYearValid = /^\d{4}-\d{4}$/.test(schoolYear);

  type FacultyLoad = { maxWeeklyHours: number; currentWeeklyHours: number };
  const facultyLoadMap = useMemo(() => {
    const m = new Map<string, FacultyLoad>();
    for (const sub of subjects) {
      for (const f of sub.faculties) {
        if (f.maxWeeklyHours != null && f.maxWeeklyHours > 0) {
          m.set(String(f.id), {
            maxWeeklyHours: f.maxWeeklyHours,
            currentWeeklyHours: f.currentWeeklyHours ?? 0,
          });
        }
      }
    }
    return m;
  }, [subjects]);

  // Subjects (with their term-assigned faculties) depend on the whole context.
  useEffect(() => {
    if (!selectedProgram || !selectedYearLevel || !schoolYearValid) {
      setSubjects([]);
      return;
    }
    let stale = false;
    scheduleService
      .listScheduleSubjects({
        schoolYear,
        programId: selectedProgram.id,
        yearLevel: selectedYearLevel,
        semester,
      })
      .then((result) => {
        if (!stale) setSubjects(result);
      })
      .catch(() => {
        if (!stale) setSubjects([]);
      });
    return () => {
      stale = true;
    };
  }, [selectedProgram, selectedYearLevel, semester, schoolYear, schoolYearValid]);

  // Subject types the selected subjects need but no weekly hour allocation
  // covers — the backend silently drops those subjects when auto-generating
  // and refuses to save them, so warn before the user even tries.
  const missingAllocationTypes = useMemo(() => {
    if (allocations === null) return [];
    const allocated = new Set(allocations.map((a) => a.subjectType));
    return [...new Set(subjects.map((s) => s.subjectType))].filter((t) => !allocated.has(t));
  }, [subjects, allocations]);

  const availableYearLevels = useMemo(
    () =>
      yearLevelIds.filter((yl) =>
        sets.some((s) => s.program === selectedProgram?.abbrev && s.yearLevel === yl),
      ),
    [sets, selectedProgram, yearLevelIds],
  );

  const availableSets = useMemo(
    () =>
      sets.filter(
        (s) =>
          s.program === selectedProgram?.abbrev &&
          s.yearLevel === selectedYearLevel,
      ),
    [sets, selectedProgram, selectedYearLevel],
  );

  const displaySchedules = useMemo<Schedule[]>(
    () =>
      slots.map((slot) => ({
        id: slot.tempId,
        schoolYear,
        semester,
        subjectId: String(slot.subjectId),
        subjectCode: slot.subjectCode,
        subjectTitle: slot.subjectTitle,
        setId: String(selectedSet?.id ?? ""),
        setCode: selectedSet?.setCode ?? "",
        program: selectedProgram?.abbrev ?? "",
        departmentCode: selectedProgram?.departmentAbbrev ?? "",
        yearLevel: (selectedYearLevel || 1) as YearLevel,
        facultyId: String(slot.facultyId ?? ""),
        facultyName: slot.facultyName,
        roomId: String(slot.roomId ?? ""),
        roomName: slot.roomName,
        mode: slot.mode,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    [slots, schoolYear, semester, selectedSet, selectedProgram, selectedYearLevel],
  );

  function handleProgramChange(programId: string) {
    setSelectedProgramId(programId);
    const code = programs?.find((p) => String(p.id) === programId)?.abbrev;
    const newYl = yearLevelIds.find((yl) =>
      sets.some((s) => s.program === code && s.yearLevel === yl),
    );
    setSelectedYearLevel(newYl ?? "");
    setSelectedSetId("");
    setSets([]);
    setSlots([]);
    resetGeneration();
    setConfirmedDailyHourIncreases([]);
  }

  function handleYearLevelChange(yl: YearLevel | "") {
    setSelectedYearLevel(yl);
    setSelectedSetId("");
    setSlots([]);
    resetGeneration();
    setConfirmedDailyHourIncreases([]);
  }

  async function handleAutoGenerate() {
    if (!selectedSet || !selectedProgram || !selectedYearLevel) return;

    if (missingAllocationTypes.length > 0) {
      setSaveError(
        `No weekly hour allocation configured for subject type ${missingAllocationTypes.join(", ")}.`,
      );
      return;
    }

    setSaveError(null);
    try {
      const generated = await generate({
        schoolYear,
        semester,
        semesterLabel: semesterLabel(semester),
        yearLevel: selectedYearLevel,
        yearLevelLabel: yearLevelLabel(selectedYearLevel),
        programId: selectedProgram.id,
        setId: selectedSet.id,
        confirmedDailyHourIncreases,
      });
      tempIdCounter.current = 0;
      setSlots(
        generated.map((slot) => {
          tempIdCounter.current += 1;
          return { ...slot, tempId: `tmp-${tempIdCounter.current}` };
        }),
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to generate a schedule.");
    }
  }

  async function handleResolveConflicts() {
    if (!selectedSet || !selectedProgram || !selectedYearLevel) return;
    setSaveError(null);
    const generated = await generate(
      {
        schoolYear,
        semester,
        semesterLabel: semesterLabel(semester),
        yearLevel: selectedYearLevel,
        yearLevelLabel: yearLevelLabel(selectedYearLevel),
        programId: selectedProgram.id,
        setId: selectedSet.id,
        confirmedDailyHourIncreases,
      },
      "resolve",
    );
    tempIdCounter.current = 0;
    setSlots(
      generated.map((slot) => {
        tempIdCounter.current += 1;
        return { ...slot, tempId: `tmp-${tempIdCounter.current}` };
      }),
    );
  }

  async function handleApplySuggestion(suggestion: ScheduleSuggestion) {
    if (!suggestion.apply || !selectedSet || !selectedProgram || !selectedYearLevel) return;
    const body = suggestion.apply.body as Record<string, unknown>;
    setSaveError(null);
    try {
      const result = await scheduleService.upsertSubjectHourOverride({
        subjectId: body.subjectId as number,
        syId: body.syId as number,
        semesterNumber: body.semesterNumber as number,
        setId: body.setId != null ? (body.setId as number) : null,
        lectureHours: body.lectureHours as number,
        labHours: body.labHours as number,
        meetings: body.meetings as number,
        note: typeof body.note === "string" ? body.note : undefined,
      });
      toast.success(result.created ? "Override created." : "Override updated.");
      // Re-generate after applying the suggestion so the schedule reflects the change.
      const generated = await generate({
        schoolYear,
        semester,
        semesterLabel: semesterLabel(semester),
        yearLevel: selectedYearLevel,
        yearLevelLabel: yearLevelLabel(selectedYearLevel),
        programId: selectedProgram.id,
        setId: selectedSet.id,
        confirmedDailyHourIncreases,
      });
      tempIdCounter.current = 0;
      setSlots(
        generated.map((slot) => {
          tempIdCounter.current += 1;
          return { ...slot, tempId: `tmp-${tempIdCounter.current}` };
        }),
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to apply suggestion.");
    }
  }

  /**
   * confirm_daily_hour_increase: the subject isn't in the preview yet — the only way
   * to actually place it is to regenerate with its confirm_keys merged into
   * confirmedDailyHourIncreases. Never merge suggestion.placesAt client-side here.
   */
  async function handleConfirmDailyHourIncrease(suggestion: ScheduleSuggestion) {
    if (!selectedSet || !selectedProgram || !selectedYearLevel) return;
    const bodyKeys = (suggestion.apply?.body as Record<string, unknown> | undefined)
      ?.confirmedDailyHourIncreases as string[] | undefined;
    const keys = bodyKeys ?? suggestion.confirmKeys ?? [];
    if (keys.length === 0) return;

    const merged = [...new Set([...confirmedDailyHourIncreases, ...keys])];
    setConfirmedDailyHourIncreases(merged);
    setSaveError(null);
    try {
      const generated = await generate({
        schoolYear,
        semester,
        semesterLabel: semesterLabel(semester),
        yearLevel: selectedYearLevel,
        yearLevelLabel: yearLevelLabel(selectedYearLevel),
        programId: selectedProgram.id,
        setId: selectedSet.id,
        confirmedDailyHourIncreases: merged,
      });
      tempIdCounter.current = 0;
      setSlots(
        generated.map((slot) => {
          tempIdCounter.current += 1;
          return { ...slot, tempId: `tmp-${tempIdCounter.current}` };
        }),
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to confirm daily limit increase.");
    }
  }

  function handleConfirmMove(suggestion: ScheduleSuggestion) {
    setPendingMove(suggestion);
  }

  /**
   * merge_places_at: valid slots for this subject already exist and no other saved
   * session needs to move — merge suggestion.placesAt straight into the draft slots.
   * Client-side only, no API call, and never followed by Resolve (moves is empty).
   */
  function handleUseSuggestedSlots(suggestion: ScheduleSuggestion) {
    const placesAt = suggestion.placesAt ?? [];
    if (placesAt.length === 0) return;

    const newSlots: PendingSlot[] = placesAt.map((p) => {
      tempIdCounter.current += 1;
      const subjectId = p.subjectId ?? suggestion.subjectId ?? 0;
      const subjectCode = p.subjectCode ?? suggestion.subjectCode ?? "";
      const matchedSubject = subjects.find((s) => s.id === subjectId);
      return {
        tempId: `tmp-${tempIdCounter.current}`,
        subjectId,
        subjectCode,
        subjectTitle: matchedSubject?.title ?? subjectCode,
        day: DAY_LABEL_TO_KEY[p.day] ?? "M",
        startTime: normalizeTime(p.start),
        endTime: normalizeTime(p.end),
        facultyId: p.instructorId ?? suggestion.instructorId ?? null,
        facultyName: p.instructorName ?? suggestion.instructorName ?? "",
        roomId: p.roomId ?? null,
        roomName: p.room ?? "",
        mode: (p.mode as ScheduleMode) ?? "F2F",
        sessionType: p.sessionType ?? (p.isLab ? "Lab" : "Lecture"),
      };
    });

    setSlots((current) => [...current, ...newSlots]);
    toast.success(`Added ${newSlots.length} suggested slot(s) to the preview.`);
  }

  async function executePendingMove() {
    if (!pendingMove || !pendingMove.apply || !selectedSet || !selectedProgram || !selectedYearLevel) return;
    setSaveError(null);
    try {
      if (pendingMove.type === "repack_instructor") {
        for (const move of pendingMove.moves ?? []) {
          const body = move.apply.body as Record<string, unknown>;
          await scheduleService.updateRegularSlot(move.scheduleId, {
            dayOfWeek: body.dayOfWeek as string,
            startTime: body.startTime as string,
            endTime: body.endTime as string,
            roomId: body.roomId as number,
          });
        }
        toast.success(`${(pendingMove.moves ?? []).length} session(s) rearranged successfully.`);
      } else {
        const body = pendingMove.apply.body as Record<string, unknown>;
        await scheduleService.updateRegularSlot(pendingMove.scheduleId!, {
          dayOfWeek: body.dayOfWeek as string,
          startTime: body.startTime as string,
          endTime: body.endTime as string,
          roomId: body.roomId as number,
        });
        toast.success("Session moved successfully.");
      }
      setPendingMove(null);
      // Re-generate after applying the suggestion so the schedule reflects the change.
      const generated = await generate({
        schoolYear,
        semester,
        semesterLabel: semesterLabel(semester),
        yearLevel: selectedYearLevel,
        yearLevelLabel: yearLevelLabel(selectedYearLevel),
        programId: selectedProgram.id,
        setId: selectedSet.id,
        confirmedDailyHourIncreases,
      });
      tempIdCounter.current = 0;
      setSlots(
        generated.map((slot) => {
          tempIdCounter.current += 1;
          return { ...slot, tempId: `tmp-${tempIdCounter.current}` };
        }),
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to apply suggestion.");
    }
  }

  function openAddDrawer() {
    setEditing(null);
    setConflictPrefill(null);
    setDrawerOpen(true);
  }

  function openConflictDrawer(conflictText: string) {
    const parsed = parseConflictSlot(conflictText);
    if (!parsed) return;

    const matchingSlot = slots.find(
      (s) =>
        s.subjectCode === parsed.subjectCode &&
        s.day === parsed.fromDay &&
        s.startTime === parsed.fromStartTime,
    );

    setEditing(null);
    setConflictSubjects(null);
    setConflictLoading(true);
    setDrawerOpen(true);

    const subjectsPromise = selectedProgram && schoolYearValid
      ? scheduleService.listScheduleSubjects({ schoolYear, programId: selectedProgram.id, semester })
      : Promise.resolve(null);
    const schedulesPromise = scheduleService.view().catch(() => [] as Schedule[]);

    Promise.all([subjectsPromise, schedulesPromise]).then(([allSubjects, savedSchedules]) => {
      if (allSubjects) setConflictSubjects(allSubjects);

      const savedSlot = savedSchedules.find(
        (s) =>
          s.subjectCode === parsed.subjectCode &&
          s.setCode.startsWith(parsed.setCode),
      );

      const duration = matchingSlot
        ? timeToMinutes(matchingSlot.endTime) - timeToMinutes(matchingSlot.startTime)
        : 60;
      const toEndMinutes = timeToMinutes(parsed.toStartTime) + duration;
      const toEndTime = `${String(Math.floor(toEndMinutes / 60)).padStart(2, "0")}:${String(toEndMinutes % 60).padStart(2, "0")}`;

      setConflictPrefill({
        subjectCode: parsed.subjectCode,
        day: parsed.toDay,
        startTime: parsed.toStartTime,
        endTime: toEndTime,
        roomName: parsed.toRoomName,
        facultyName: matchingSlot?.facultyName ?? savedSlot?.facultyName,
        slotTempId: matchingSlot?.tempId,
        savedScheduleId: savedSlot?.id,
      });
    }).catch(() => {
      const duration = matchingSlot
        ? timeToMinutes(matchingSlot.endTime) - timeToMinutes(matchingSlot.startTime)
        : 60;
      const toEndMinutes = timeToMinutes(parsed.toStartTime) + duration;
      const toEndTime = `${String(Math.floor(toEndMinutes / 60)).padStart(2, "0")}:${String(toEndMinutes % 60).padStart(2, "0")}`;
      setConflictPrefill({
        subjectCode: parsed.subjectCode,
        day: parsed.toDay,
        startTime: parsed.toStartTime,
        endTime: toEndTime,
        roomName: parsed.toRoomName,
        slotTempId: matchingSlot?.tempId,
      });
    }).finally(() => {
      setConflictLoading(false);
    });
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
    setConflictPrefill(null);
    setConflictSubjects(null);
    setConflictLoading(false);
  }

  async function handleSubmitSlot(slot: Omit<PendingSlot, "tempId">) {
    if (editing) {
      setSlots((current) =>
        current.map((s) => (s.tempId === editing.tempId ? { ...slot, tempId: editing.tempId } : s)),
      );
      closeDrawer();
    } else if (conflictPrefill?.savedScheduleId) {
      const savedId = Number(conflictPrefill.savedScheduleId);
      try {
        const msg = await scheduleService.updateRegularSlot(savedId, {
          dayOfWeek: DAY_LABELS[slot.day],
          startTime: slot.startTime,
          endTime: slot.endTime,
          roomId: slot.roomId,
        });
        if (msg) toast.success(msg);
        setSlots((current) => [
          ...current.filter((s) => s.tempId !== conflictPrefill.slotTempId),
          { ...slot, tempId: `tmp-${Date.now()}` },
        ]);
      } catch (err) {
        if (err instanceof ApiError) toast.error(err.message);
        else throw err;
      }
      closeDrawer();
    } else if (conflictPrefill?.slotTempId) {
      setSlots((current) =>
        current.map((s) =>
          s.tempId === conflictPrefill.slotTempId ? { ...slot, tempId: conflictPrefill.slotTempId! } : s,
        ),
      );
      closeDrawer();
    } else {
      tempIdCounter.current += 1;
      setSlots((current) => [...current, { ...slot, tempId: `tmp-${tempIdCounter.current}` }]);
      closeDrawer();
    }
  }

  function handleEditSlot(schedule: Schedule) {
    const slot = slots.find((s) => s.tempId === schedule.id);
    if (!slot) return;
    setEditing(slot);
    setDrawerOpen(true);
  }

  function handleRemoveSlot(schedule: Schedule) {
    setDeleteTarget(schedule);
  }

  async function confirmRemoveSlot() {
    if (!deleteTarget) return;
    setSlots((current) => current.filter((s) => s.tempId !== deleteTarget.id));
  }

  function handleDuplicateSlot(schedule: Schedule, day: Day) {
    const slot = slots.find((s) => s.tempId === schedule.id);
    if (!slot) return;
    tempIdCounter.current += 1;
    setSlots((current) => [...current, { ...slot, day, tempId: `tmp-${tempIdCounter.current}` }]);
  }

  async function handleSave() {
    if (!selectedSet || !selectedProgram) return;

    setSaveError(null);
    setIsSaving(true);
    try {
      const result = await scheduleService.createRegular({
        schoolYear,
        semester,
        programId: selectedProgram.id,
        setId: selectedSet.id,
        slots: slots.map((s) => ({
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          subjectId: s.subjectId,
          mode: s.mode,
          facultyId: s.facultyId as number,
          facultyName: s.facultyName,
          roomId: s.roomId,
        })),
      });
      if (result.message) toast.success(result.message);
      if (result.warnings?.length) {
        for (const w of result.warnings) toast.warning(w);
      }
      if (result.rescheduled?.length) {
        for (const n of result.rescheduled) toast.info(n);
      }
      setSlots([]);
      tempIdCounter.current = 0;
      resetGeneration();
      setConfirmedDailyHourIncreases([]);
      setEditing(null);
      setDrawerOpen(false);
      setConflictPrefill(null);
      setConflictSubjects(null);
      setConflictLoading(false);
      setDeleteTarget(null);
      setPendingMove(null);
      setSets((current) => current.filter((s) => s.id !== selectedSet.id));
      setSelectedSetId("");
      setIsSaving(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "");
      setIsSaving(false);
    }
  }

  const contextLocked = slots.length > 0 || isGenerating || isSaving;
  const canGenerateBase = Boolean(selectedSet) && Boolean(selectedYearLevel) && schoolYearValid;
  const canGenerate = canGenerateBase && !isGenerating;
  const canAddSlot = Boolean(selectedSet) && schoolYearValid && subjects.length > 0;
  const lockHint = slots.length > 0 ? "Remove all slots to change." : undefined;
  const isLoading = programs === null || schoolYearsLoading;
  /** Without at least one academic term there's nothing to schedule. */
  const noAcademicTerm = !schoolYearsLoading && schoolYears.length === 0;

  function selectedTermParams() {
    if (!matchedSy) return null;
    return {
      syId: matchedSy.id,
      semesterNumber: semester,
    };
  }

  async function handleCheckLedgers() {
    const params = selectedTermParams();
    if (!params) return;
    setLedgerError(null);
    setCheckingLedgers(true);
    try {
      const result = await scheduleService.reconcileInstructorLedgers(params);
      if (result.drift.length > 0) {
        setLedgerDriftCount(result.drift.length);
      } else if (result.message) {
        toast.success(result.message);
      }
    } catch (err) {
      setLedgerError(err instanceof Error ? err.message : "");
    } finally {
      setCheckingLedgers(false);
    }
  }

  async function handleRepairLedgers() {
    const params = selectedTermParams();
    if (!params) return;
    const result = await scheduleService.reconcileInstructorLedgers(params, true);
    if (result.message) toast.success(result.message);
    setLedgerDriftCount(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="New Schedule"

        actions={
          noAcademicTerm ? undefined : (
            <>
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={!matchedSy || isSaving || isGenerating}
                isLoading={checkingLedgers}
                loadingLabel="Checking…"
                onClick={handleCheckLedgers}
              >
                <RefreshCwIcon />
                Check Ledgers
              </Button>
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={isSaving || isGenerating}
                onClick={() => navigate("/schedules/regular-class")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                block={false}
                disabled={slots.length === 0 || !selectedSet || isGenerating}
                isLoading={isSaving}
                loadingLabel="Saving…"
                onClick={handleSave}
              >
                Save Schedule{slots.length > 0 ? ` (${slots.length})` : ""}
              </Button>
            </>
          )
        }
      />

      {isLoading ? (
        <div className="mt-6">
          <ScheduleBuilderSkeleton />
        </div>
      ) : noAcademicTerm ? (
        <div className="mt-6">
          <EmptyState
            title="No school years yet"
            action={
              <Button type="button" block={false} onClick={() => navigate("/academic-term")}>
                Create academic term
              </Button>
            }
          >
            Create the first academic term before scheduling classes.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <AnimatePresence>
            {saveError && (
              <Alert key="save-error" variant="destructive">
                <AlertIcon />
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
            {ledgerError && (
              <Alert key="ledger-error" variant="destructive">
                <AlertIcon />
                <AlertDescription>{ledgerError}</AlertDescription>
              </Alert>
            )}
          </AnimatePresence>

          {missingAllocationTypes.length > 0 && (
            <Alert variant="destructive">
              <AlertIcon />
              <AlertDescription>
                <div className="flex flex-col gap-3">
                  <span>
                    No weekly hour allocation configured for subject type{" "}
                    <span className="font-semibold">{missingAllocationTypes.join(", ")}</span>.
                    Auto-generation needs the weekly hours and meetings for every subject type first.
                  </span>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      block={false}
                      onClick={() => navigate("/schedules/weekly-hour-allocations")}
                    >
                      Set weekly hour allocations
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <AnimatePresence>
            {generationResolution && (
              <Alert
                key="generation-resolution"
                variant={generationResolution.unresolved.length > 0 ? "warning" : "success"}
              >
                <AlertTitle>Conflict resolution finished</AlertTitle>
                <AlertDescription>
                  Completed {generationResolution.passes} {generationResolution.passes === 1 ? "pass" : "passes"} and moved{" "}
                  {generationResolution.sessionsMoved} saved {generationResolution.sessionsMoved === 1 ? "session" : "sessions"}.
                  {generationResolution.movesRefused.length > 0 && (
                    <> {generationResolution.movesRefused.length} {generationResolution.movesRefused.length === 1 ? "move was" : "moves were"} refused.</>
                  )}
                  {generationResolution.unresolved.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {generationResolution.unresolved.map((conflict) => (
                        <li key={conflict}>{conflict}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {generationConflicts.length > 0 && (
              <GenerationConflictsAlert
                key="generation-conflicts"
                conflicts={generationConflicts}
                subjectCodes={subjects.map((subject) => subject.code)}
                suggestions={generationSuggestions}
                onEditConflict={openConflictDrawer}
                onApplySuggestion={handleApplySuggestion}
                onConfirmMove={handleConfirmMove}
                onUseSuggestedSlots={handleUseSuggestedSlots}
                onConfirmDailyHourIncrease={handleConfirmDailyHourIncrease}
                onResolve={() => setResolveOpen(true)}
              />
            )}
          </AnimatePresence>

          <ScheduleContextForm
            schoolYears={schoolYears}
            schoolYear={schoolYear}
            onSchoolYearChange={setSchoolYear}
            semesters={semesters}
            semester={semester}
            onSemesterChange={setSemester}
            semesterLabel={semesterLabel}
            programs={programs}
            selectedProgramId={selectedProgramId}
            onProgramChange={handleProgramChange}
            availableYearLevels={availableYearLevels}
            selectedYearLevel={selectedYearLevel}
            onYearLevelChange={handleYearLevelChange}
            yearLevelLabel={yearLevelLabel}
            availableSets={availableSets}
            selectedSetId={selectedSetId}
            onSetIdChange={setSelectedSetId}
            locked={contextLocked}
            lockHint={lockHint}
          />

          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="hidden sm:block" />
            <div className="flex justify-center">
              <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
            </div>
            <div className="flex justify-end gap-2">
              {slots.length > 0 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    disabled={!canGenerate}
                    isLoading={isGenerating}
                    loadingLabel="Regenerating…"
                    onClick={handleAutoGenerate}
                  >
                    <RotateIcon />
                    Regenerate
                  </Button>
                  <Button type="button" block={false} disabled={!canAddSlot || isGenerating || isSaving} onClick={openAddDrawer}>
                    <PlusIcon />
                    Add Slot
                  </Button>
                </>
              )}
            </div>
          </div>



          {slots.length === 0 ? (
            <EmptyState
              title="No slots yet"
              action={
                canGenerateBase ? (
                  <Button
                    type="button"
                    block={false}
                    disabled={!canGenerate}
                    isLoading={isGenerating}
                    loadingLabel={hasGenerated ? "Regenerating…" : "Generating…"}
                    onClick={handleAutoGenerate}
                  >
                    {hasGenerated ? <RotateIcon /> : <AutoGenerateIcon />}
                    {hasGenerated ? "Regenerate" : "Auto-Generate"}
                  </Button>
                ) : undefined
              }
            >
              {canGenerateBase
                ? "Auto-generate a schedule for the selected set, then fine-tune the slots."
                : "Pick a school year, semester, program, year level, and set with assigned subjects first."}
            </EmptyState>
          ) : viewMode === "grid" ? (
            <ScheduleGrid
              schedules={displaySchedules}
              onEdit={handleEditSlot}
              onDelete={handleRemoveSlot}
              onDuplicate={handleDuplicateSlot}
              facultyLoadMap={facultyLoadMap}
            />
          ) : (
            <ScheduleTable
              schedules={displaySchedules}
              onEdit={handleEditSlot}
              onDelete={handleRemoveSlot}
              onDuplicate={handleDuplicateSlot}
              facultyLoadMap={facultyLoadMap}
            />
          )}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit Slot" : conflictPrefill ? `Move ${conflictPrefill.subjectCode}` : "Add Slot"}
      >
        {conflictLoading ? (
          <div className="grid place-items-center py-8">
            <Spinner />
          </div>
        ) : (
          <SlotEntryForm
            key={editing?.tempId ?? conflictPrefill?.subjectCode ?? "new"}
            initialSlot={editing ?? undefined}
            subjects={conflictPrefill && conflictSubjects ? conflictSubjects : subjects}
            conflictPrefill={conflictPrefill ?? undefined}
            isConflictMove={Boolean(conflictPrefill)}
            rooms={rooms}
            existingSlots={slots}
            onAdd={handleSubmitSlot}
            onCancelEdit={editing ? closeDrawer : undefined}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remove slot"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={confirmRemoveSlot}
      >
        {deleteTarget && (
          <>
            <span className="font-medium text-navy-700 dark:text-mist-100">
              {deleteTarget.subjectCode}
            </span>{" "}
            on {dayLabels[deleteTarget.day]} ({formatTime(deleteTarget.startTime)}–
            {formatTime(deleteTarget.endTime)}) will be removed from this schedule.
          </>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve schedule conflicts?"
        confirmLabel="Resolve conflicts"
        loadingLabel="Resolving…"
        onConfirm={handleResolveConflicts}
      >
        The conflict resolver may move already-saved sessions from other sets when it can do so without
        displacing a class. Those moves are written immediately; the generated schedule remains a proposal
        until you save it.
      </ConfirmDialog>

      <ConfirmDialog
        open={pendingMove !== null}
        onClose={() => setPendingMove(null)}
        title={
          pendingMove?.type === "repack_instructor"
            ? "Rearrange this instructor's week?"
            : "Move another section's class?"
        }
        confirmLabel={pendingMove?.type === "repack_instructor" ? "Rearrange & apply" : "Move the class"}
        loadingLabel={pendingMove?.type === "repack_instructor" ? "Rearranging…" : "Moving…"}
        confirmVariant={
          pendingMove?.type === "repack_instructor" && (pendingMove.displaces ?? []).length > 0
            ? "danger"
            : "primary"
        }
        onConfirm={executePendingMove}
      >
        {pendingMove && pendingMove.type === "repack_instructor" ? (
          <div className="flex flex-col gap-3">
            <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
              {pendingMove.setName} · {pendingMove.subjectCode} · {pendingMove.instructorName}
            </p>
            <div className="flex flex-col gap-1.5">
              {(pendingMove.moves ?? []).map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-white/10 dark:bg-white/5"
                >
                  <p className="font-body text-xs font-semibold text-navy-700 dark:text-mist-100">
                    {m.subjectCode} ({m.setName})
                  </p>
                  <div className="mt-1 flex items-center gap-2 font-body text-xs text-slate-600 dark:text-slate-300">
                    <span>{m.from.day} {m.from.start}–{m.from.end}, {m.from.room}</span>
                    <span className="text-slate-400">→</span>
                    <span>{m.to.day} {m.to.start}–{m.to.end}, {m.to.room}</span>
                  </div>
                </div>
              ))}
            </div>
            {(pendingMove.placesAt ?? []).length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 dark:border-emerald-400/25 dark:bg-emerald-400/5">
                <p className="font-body text-xs font-semibold text-navy-700 dark:text-mist-100">
                  {pendingMove.subjectCode} then takes
                </p>
                <p className="mt-1 font-body text-xs text-slate-600 dark:text-slate-300">
                  {(pendingMove.placesAt ?? [])
                    .map((p) => `${p.day} ${p.start}–${p.end} in ${p.room}${p.isLab ? " (lab)" : ""}`)
                    .join(", ")}
                </p>
              </div>
            )}
            {(pendingMove.displaces ?? []).length > 0 && (
              <p className="font-body text-sm font-semibold text-red-700 dark:text-red-300">
                Trade-off: {(pendingMove.displaces ?? []).length} already-saved session(s) will become unplaced —{" "}
                {(pendingMove.displaces ?? [])
                  .map((d) => `${d.subjectCode} ${d.day} ${formatDecimalHour(d.start)}`)
                  .join(", ")}
                .
              </p>
            )}
          </div>
        ) : (
          pendingMove && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                  {pendingMove.setName} · {pendingMove.subjectCode} · {pendingMove.instructorName}
                </p>
                <div className="mt-2 flex items-center gap-2 font-body text-xs text-slate-600 dark:text-slate-300">
                  <span>{String(pendingMove.from?.day)} {String(pendingMove.from?.start)}–{String(pendingMove.from?.end)}, {String(pendingMove.from?.room)}</span>
                  <span className="text-slate-400">→</span>
                  <span>{String(pendingMove.to?.day)} {String(pendingMove.to?.start)}–{String(pendingMove.to?.end)}, {String(pendingMove.to?.room)}</span>
                </div>
              </div>
              <p className="font-body text-sm text-slate-600 dark:text-slate-300">
                This frees the slot for {pendingMove.enables?.subject_code}.
                <span className="ml-1 font-semibold">{pendingMove.setName}'s</span> timetable changes immediately.
              </p>
            </div>
          )
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={ledgerDriftCount !== null && ledgerDriftCount > 0}
        onClose={() => setLedgerDriftCount(null)}
        title="Repair instructor ledgers"
        confirmLabel="Repair ledgers"
        loadingLabel="Repairing…"
        onConfirm={handleRepairLedgers}
      >
        The read-only check found {ledgerDriftCount} ledger {ledgerDriftCount === 1 ? "discrepancy" : "discrepancies"}.
        Recalculate the counters from the saved schedule sessions?
      </ConfirmDialog>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title={isGenerating ? "Cancel schedule generation?" : "Discard unsaved schedule?"}
        confirmLabel={isGenerating ? "Cancel Generation" : "Discard"}
        loadingLabel={isGenerating ? "Cancelling…" : "Discarding…"}
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        {isGenerating
          ? "Schedule generation is in progress. Leaving this page will cancel it."
          : "You have unsaved schedule slots. Leaving this page will discard them."}
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title={isGenerating ? "Cancel schedule generation?" : "Discard unsaved schedule?"}
        confirmLabel={isGenerating ? "Cancel Generation" : "Reload"}
        loadingLabel={isGenerating ? "Cancelling…" : "Reloading…"}
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        {isGenerating
          ? "Schedule generation is in progress. Reloading will cancel it."
          : "You have unsaved schedule slots. Reloading will discard them."}
      </ConfirmDialog>
    </div>
  );
}
