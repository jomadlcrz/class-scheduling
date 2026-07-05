import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "../../../auth/role-guard";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { PlusIcon, PrinterIcon } from "../../../components/ui/icons";
import { ConfirmDialog, Modal } from "../../../components/ui/modal";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { ScheduleForm } from "../../../features/schedules/schedule-form";
import { ScheduleGrid } from "../../../features/schedules/schedule-grid";
import { ScheduleTable } from "../../../features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "../../../features/schedules/schedule-view-toggle";
import { PageHeader } from "../../../layouts/page-header";
import { facultyService } from "../../../services/faculty.service";
import { programService } from "../../../services/program.service";
import { roomService } from "../../../services/room.service";
import { scheduleService } from "../../../services/schedule.service";
import { setService } from "../../../services/set.service";
import { subjectService } from "../../../services/subject.service";
import type { Faculty } from "../../../types/faculty";
import type { Program } from "../../../types/program";
import type { Room } from "../../../types/room";
import {
  DAYS,
  DAY_LABELS,
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTERS,
  SCHEDULE_SEMESTER_LABELS,
  SCHOOL_YEARS,
  type CreateScheduleInput,
  type Schedule,
  type ScheduleSemester,
} from "../../../types/schedule";
import type { ClassSet } from "../../../types/set";
import type { Subject } from "../../../types/subject";
import { YEAR_LEVELS, YEAR_LEVEL_LABELS, type YearLevel } from "../../../types/subject";

export function meta() {
  return [
    { title: "Regular Class — GWC Class Scheduling" },
    { name: "description", content: "Assign subjects to time slots and manage class schedules." },
  ];
}

export default function RegularClassRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <RegularClassPage />
    </RoleGuard>
  );
}

type PageData = {
  schedules: Schedule[];
  subjects: Subject[];
  sets: ClassSet[];
  faculty: Faculty[];
  rooms: Room[];
  programs: Program[];
};

function RegularClassPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PageData | null>(null);

  // Filters — pin the view to a single section's weekly schedule.
  const [schoolYear, setSchoolYear] = useState(DEFAULT_SCHOOL_YEAR);
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState<YearLevel | "">("");
  const [setId, setSetId] = useState("");

  const [viewMode, setViewMode] = useState<ScheduleViewMode>("grid");

  const [editTarget, setEditTarget] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  useEffect(() => {
    Promise.all([
      scheduleService.list(),
      subjectService.list(),
      setService.list(),
      facultyService.list(),
      roomService.list(),
      programService.list(),
    ]).then(([schedules, subjects, sets, faculty, rooms, programs]) => {
      setData({ schedules, subjects, sets, faculty, rooms, programs });

      const firstProgram = programs[0]?.code ?? "";
      const firstYl =
        YEAR_LEVELS.find((yl) => sets.some((s) => s.program === firstProgram && s.yearLevel === yl)) ??
        (1 as YearLevel);
      const firstSet = sets.find((s) => s.program === firstProgram && s.yearLevel === firstYl);
      setProgram(firstProgram);
      setYearLevel(firstYl);
      setSetId(firstSet?.id ?? "");
    });
  }, []);

  const availableYearLevels = useMemo(
    () =>
      YEAR_LEVELS.filter((yl) =>
        (data?.sets ?? []).some((s) => s.program === program && s.yearLevel === yl),
      ),
    [data, program],
  );

  const availableSets = useMemo(
    () =>
      (data?.sets ?? [])
        .filter((s) => s.program === program && s.yearLevel === yearLevel)
        .sort((a, b) => a.setCode.localeCompare(b.setCode)),
    [data, program, yearLevel],
  );

  function handleProgramChange(next: string) {
    setProgram(next);
    const newYl =
      YEAR_LEVELS.find((yl) => (data?.sets ?? []).some((s) => s.program === next && s.yearLevel === yl)) ??
      (1 as YearLevel);
    setYearLevel(newYl);
    setSetId((data?.sets ?? []).find((s) => s.program === next && s.yearLevel === newYl)?.id ?? "");
  }

  function handleYearLevelChange(yl: YearLevel) {
    setYearLevel(yl);
    setSetId((data?.sets ?? []).find((s) => s.program === program && s.yearLevel === yl)?.id ?? "");
  }

  const visibleSchedules = useMemo(() => {
    if (!data) return [];
    return data.schedules
      .filter(
        (s) => s.setId === setId && s.schoolYear === schoolYear && s.semester === semester,
      )
      .sort(
        (a, b) =>
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
  }, [data, setId, schoolYear, semester]);

  async function handleEdit(input: CreateScheduleInput) {
    if (!editTarget) return;
    const updated = await scheduleService.update(editTarget.id, input);
    setData((d) =>
      d && { ...d, schedules: d.schedules.map((s) => (s.id === updated.id ? updated : s)) },
    );
    setEditTarget(null);
  }

  async function handleDelete(target: Schedule) {
    await scheduleService.remove(target.id);
    setData((d) => d && { ...d, schedules: d.schedules.filter((s) => s.id !== target.id) });
  }

  const isLoading = data === null;

  return (
    <>
      <PageHeader
        title="Regular Schedule Builder"
        description="Class schedules for the current academic term."
        actions={
          <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
            <PlusIcon />
            Create Schedule
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Select
            id="rc-school-year"
            label="School Year"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
          >
            {SCHOOL_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select
            id="rc-year-level"
            label="Year Level"
            value={yearLevel}
            onChange={(e) => handleYearLevelChange(Number(e.target.value) as YearLevel)}
          >
            {availableYearLevels.length === 0 ? (
              <option value="">No year levels</option>
            ) : (
              availableYearLevels.map((yl) => (
                <option key={yl} value={yl}>{YEAR_LEVEL_LABELS[yl]}</option>
              ))
            )}
          </Select>
          <Select
            id="rc-semester"
            label="Semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value) as ScheduleSemester)}
          >
            {SCHEDULE_SEMESTERS.map((s) => (
              <option key={s} value={s}>{SCHEDULE_SEMESTER_LABELS[s]}</option>
            ))}
          </Select>
          <Select
            id="rc-program"
            label="Program"
            value={program}
            onChange={(e) => handleProgramChange(e.target.value)}
          >
            {(data?.programs ?? []).map((p) => (
              <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
            ))}
          </Select>
          <Select
            id="rc-set"
            label="Set"
            value={setId}
            onChange={(e) => setSetId(e.target.value)}
          >
            {availableSets.length === 0 ? (
              <option value="">No sets</option>
            ) : (
              availableSets.map((s) => (
                <option key={s.id} value={s.id}>{s.program}-{s.yearLevel}{s.setCode}</option>
              ))
            )}
          </Select>
        </div>
      </div>

      {/* View toggle + print */}
      <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="hidden sm:block" />
        <div className="flex justify-center">
          <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" block={false} onClick={() => window.print()}>
            <PrinterIcon />
            Print
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div
            role="status"
            aria-label="Loading schedules"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleSchedules.length === 0 ? (
          <EmptyState title="No classes scheduled">
            No classes for this section yet. Use “Create Schedule” to build its weekly schedule.
          </EmptyState>
        ) : viewMode === "grid" ? (
          <ScheduleGrid schedules={visibleSchedules} />
        ) : (
          <ScheduleTable
            schedules={visibleSchedules}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Schedule">
        {editTarget && data && (
          <ScheduleForm
            schedule={editTarget}
            programs={data.programs}
            subjects={data.subjects}
            sets={data.sets}
            faculty={data.faculty}
            rooms={data.rooms}
            defaultSchoolYear={schoolYear}
            defaultSemester={semester}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete schedule"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        Remove{" "}
        <span className="font-medium text-navy-700 dark:text-white">
          {deleteTarget?.subjectCode}
        </span>{" "}
        (Set {deleteTarget?.setCode}, {DAY_LABELS[deleteTarget?.day ?? "M"]}{" "}
        {deleteTarget?.startTime}–{deleteTarget?.endTime}) from the schedule?
      </ConfirmDialog>
    </>
  );
}
