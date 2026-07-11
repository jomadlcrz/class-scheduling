import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { ResultState } from "~/components/feedback/result-state";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Drawer } from "~/components/ui/drawer";
import { EmptyState } from "~/components/ui/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { SlotEntryForm, type PendingSlot } from "~/features/schedules/slot-entry-form";
import { getHoursForSubjectType } from "~/lib/weekly-hours";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import { roomService } from "~/services/room.service";
import { scheduleService } from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import { subjectService } from "~/services/subject.service";
import type { Faculty } from "~/types/faculty";
import type { Program } from "~/types/program";
import type { Room } from "~/types/room";
import {
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTER_LABELS,
  SCHEDULE_SEMESTERS,
  SCHOOL_YEARS,
  getSlotDurationHours,
  type Day,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";
import { YEAR_LEVEL_LABELS, YEAR_LEVELS, type YearLevel } from "~/types/subject";

function ZapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function meta() {
  return [
    { title: "New Schedule — GWC Class Scheduling" },
    { name: "description", content: "Build a week schedule for a set." },
  ];
}

export default function SchedulesNew() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <SchedulesNewPage />
    </RoleGuard>
  );
}

type PageData = {
  subjects: Subject[];
  sets: ClassSet[];
  faculty: Faculty[];
  rooms: Room[];
  programs: Program[];
};

const DAY_ORDER: Day[] = ["M", "T", "W", "Th", "F"];
const TIME_BLOCKS = [
  { start: "07:00", end: "10:00" },
  { start: "10:00", end: "13:00" },
  { start: "13:00", end: "16:00" },
  { start: "16:00", end: "19:00" },
];

function SchedulesNewPage() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<PageData | null>(null);

  const [schoolYear, setSchoolYear] = useState(DEFAULT_SCHOOL_YEAR);
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | "">("");
  const [selectedSetId, setSelectedSetId] = useState("");

  const [slots, setSlots] = useState<PendingSlot[]>([]);
  const [editing, setEditing] = useState<PendingSlot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const tempIdCounter = useRef(0);

  // useEffect(() => {
  //   Promise.all([
  //     subjectService.list(),
  //     setService.list(),
  //     Promise.resolve([] as Faculty[]),
  //     roomService.list(),
  //     programService.list(),
  //   ]).then(([subjects, sets, faculty, rooms, programs]) => {
  //     setPageData({ subjects, sets, faculty, rooms, programs });
  //
  //     const firstProgram = programs[0]?.code ?? "";
  //     const firstYl =
  //       YEAR_LEVELS.find((yl) => sets.some((s) => s.program === firstProgram && s.yearLevel === yl)) ??
  //       (1 as YearLevel);
  //     const firstSet = sets.find((s) => s.program === firstProgram && s.yearLevel === firstYl);
  //
  //     setSelectedProgram(firstProgram);
  //     setSelectedYearLevel(firstYl);
  //     setSelectedSetId(firstSet?.id ?? "");
  //   });
  // }, []);

  const selectedSet = pageData?.sets.find((s) => s.id === selectedSetId);

  const availableYearLevels = useMemo(
    () =>
      YEAR_LEVELS.filter((yl) =>
        (pageData?.sets ?? []).some((s) => s.program === selectedProgram && s.yearLevel === yl),
      ),
    [pageData, selectedProgram],
  );

  const availableSets = useMemo(
    () =>
      (pageData?.sets ?? []).filter(
        (s) => s.program === selectedProgram && s.yearLevel === selectedYearLevel,
      ),
    [pageData, selectedProgram, selectedYearLevel],
  );

  const availableSubjects = useMemo(
    () =>
      (pageData?.subjects ?? []).filter(
        (s) => s.program === selectedProgram && s.yearLevel === selectedYearLevel && s.semester === semester,
      ),
    [pageData, selectedProgram, selectedYearLevel, semester],
  );

  const displaySchedules = useMemo<Schedule[]>(
    () =>
      slots.map((slot) => ({
        id: slot.tempId,
        schoolYear,
        semester,
        subjectId: slot.subjectId,
        subjectCode: slot.subjectCode,
        subjectTitle: slot.subjectTitle,
        setId: selectedSet?.id ?? "",
        setCode: selectedSet?.setCode ?? "",
        program: selectedSet?.program ?? selectedProgram,
        yearLevel: selectedSet?.yearLevel ?? ((selectedYearLevel || 1) as YearLevel),
        facultyId: slot.facultyId,
        facultyName: slot.facultyName,
        roomId: slot.roomId,
        roomName: slot.roomName,
        buildingCode: slot.buildingCode,
        mode: slot.mode,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    [slots, schoolYear, semester, selectedSet, selectedProgram, selectedYearLevel],
  );

  function handleProgramChange(program: string) {
    setSelectedProgram(program);
    const newYl =
      YEAR_LEVELS.find((yl) =>
        (pageData?.sets ?? []).some((s) => s.program === program && s.yearLevel === yl),
      ) ?? (1 as YearLevel);
    setSelectedYearLevel(newYl);
    setSelectedSetId(
      (pageData?.sets ?? []).find((s) => s.program === program && s.yearLevel === newYl)?.id ?? "",
    );
    setSlots([]);
  }

  function handleYearLevelChange(yl: YearLevel) {
    setSelectedYearLevel(yl);
    setSelectedSetId(
      (pageData?.sets ?? []).find((s) => s.program === selectedProgram && s.yearLevel === yl)?.id ?? "",
    );
    setSlots([]);
  }

  // function handleAutoGenerate() {
  //   if (!pageData || !selectedSet) return;
  //
  //   const programSubjects = availableSubjects;
  //   const activeFaculty = pageData.faculty.filter((f) => f.status === "active");
  //   if (programSubjects.length === 0 || activeFaculty.length === 0 || pageData.rooms.length === 0) return;
  //
  //   setAutoGenerating(true);
  //
  //   // Small delay so the spinner renders
  //   setTimeout(() => {
  //     const sortedSubjects = [...programSubjects].sort(
  //       (a, b) => a.code.localeCompare(b.code),
  //     );
  //
  //     // Grid of available slots: iterate day x timeBlock
  //     const gridSlots: Array<{ day: Day; startTime: string; endTime: string }> = [];
  //     for (const day of DAY_ORDER) {
  //       for (const block of TIME_BLOCKS) {
  //         gridSlots.push({ day, startTime: block.start, endTime: block.end });
  //       }
  //     }
  //
  //     const newSlots: Omit<PendingSlot, "tempId">[] = [];
  //     let cursor = 0;
  //
  //     for (const subject of sortedSubjects) {
  //       const h = getHoursForSubjectType(subject.subjectType);
  //       const totalHours = h.lectureHours + h.labHours;
  //       const numSlots = Math.max(1, Math.ceil(totalHours / 3));
  //
  //       for (let i = 0; i < numSlots && cursor < gridSlots.length; i++) {
  //         const slot = gridSlots[cursor];
  //         cursor++;
  //
  //         const facultyMember = activeFaculty[newSlots.length % activeFaculty.length];
  //         const room = pageData.rooms[newSlots.length % pageData.rooms.length];
  //
  //         newSlots.push({
  //           subjectId: subject.id,
  //           subjectCode: subject.code,
  //           subjectTitle: subject.title,
  //           day: slot.day,
  //           startTime: slot.startTime,
  //           endTime: slot.endTime,
  //           facultyId: facultyMember.id,
  //           facultyName: `${facultyMember.firstName} ${facultyMember.lastName}`,
  //           roomId: room.id,
  //           roomName: room.name,
  //           buildingCode: room.buildingCode,
  //           mode: "F2F" as const,
  //         });
  //       }
  //     }
  //
  //     tempIdCounter.current = 0;
  //     const slotsWithIds: PendingSlot[] = newSlots.map((slot) => {
  //       tempIdCounter.current += 1;
  //       return { ...slot, tempId: `tmp-${tempIdCounter.current}` };
  //     });
  //
  //     setSlots(slotsWithIds);
  //     setAutoGenerating(false);
  //   }, 200);
  // }

  function openAddDrawer() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  function handleSubmitSlot(slot: Omit<PendingSlot, "tempId">) {
    if (editing) {
      setSlots((current) =>
        current.map((s) => (s.tempId === editing.tempId ? { ...slot, tempId: editing.tempId } : s)),
      );
    } else {
      tempIdCounter.current += 1;
      setSlots((current) => [...current, { ...slot, tempId: `tmp-${tempIdCounter.current}` }]);
    }
    closeDrawer();
  }

  function handleEditSlot(schedule: Schedule) {
    const slot = slots.find((s) => s.tempId === schedule.id);
    if (!slot) return;
    setEditing(slot);
    setDrawerOpen(true);
  }

  function handleRemoveSlot(schedule: Schedule) {
    setSlots((current) => current.filter((s) => s.tempId !== schedule.id));
  }

  function handleDuplicateSlot(schedule: Schedule, day: Day) {
    const slot = slots.find((s) => s.tempId === schedule.id);
    if (!slot) return;
    tempIdCounter.current += 1;
    setSlots((current) => [
      ...current,
      { ...slot, day, tempId: `tmp-${tempIdCounter.current}` },
    ]);
  }

  // async function handleSave() {
  //   if (!selectedSet) return;
  //
  //   setSaveError(null);
  //   setIsSaving(true);
  //   const remaining = [...slots];
  //   try {
  //     for (const slot of slots) {
  //       await scheduleService.create({
  //         schoolYear,
  //         semester,
  //         subjectId: slot.subjectId,
  //         subjectCode: slot.subjectCode,
  //         subjectTitle: slot.subjectTitle,
  //         setId: selectedSet.id,
  //         setCode: selectedSet.setCode,
  //         program: selectedSet.program,
  //         yearLevel: selectedSet.yearLevel,
  //         facultyId: slot.facultyId,
  //         facultyName: slot.facultyName,
  //         roomId: slot.roomId,
  //         roomName: slot.roomName,
  //         buildingCode: slot.buildingCode,
  //         mode: slot.mode,
  //         day: slot.day,
  //         startTime: slot.startTime,
  //         endTime: slot.endTime,
  //       });
  //       remaining.shift();
  //     }
  //     navigate("/schedules/regular-class");
  //   } catch (err) {
  //     setSlots(remaining);
  //     setSaveError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
  //     setIsSaving(false);
  //   }
  // }

  const contextLocked = slots.length > 0;
  const canAddSlot = Boolean(selectedSet) && availableSubjects.length > 0;
  const canAutoGenerate = Boolean(selectedSet) && availableSubjects.length > 0;
  const lockHint = contextLocked ? "Remove all slots to change." : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="New Schedule"
        description="Select a set, auto-generate or add time slots for its subjects, then save the whole week at once."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => navigate("/schedules/regular-class")}
            >
              Cancel
            </Button>
            {/* <Button
              type="button"
              block={false}
              disabled={slots.length === 0 || !selectedSet}
              isLoading={isSaving}
              loadingLabel="Saving…"
              onClick={handleSave}
            >
              Save Schedule{slots.length > 0 ? ` (${slots.length})` : ""}
            </Button> */}
          </>
        }
      />

      <ResultState tone="error" title="Not available">
        This feature is not connected to the backend yet.
      </ResultState>
    </div>
  );
}
