import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "../../../auth/role-guard";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { PlusIcon } from "../../../components/ui/icons";
import { Input } from "../../../components/ui/input";
import { ConfirmDialog, Modal } from "../../../components/ui/modal";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { ScheduleForm } from "../../../features/schedules/schedule-form";
import { ScheduleTable } from "../../../features/schedules/schedule-table";
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
  SCHEDULE_SEMESTER_LABELS,
  SCHEDULE_SEMESTERS,
  SCHOOL_YEARS,
  type CreateScheduleInput,
  type Schedule,
  type ScheduleSemester,
} from "../../../types/schedule";
import { YEAR_LEVELS, YEAR_LEVEL_LABELS, type YearLevel } from "../../../types/subject";
import type { ClassSet } from "../../../types/set";
import type { Subject } from "../../../types/subject";

export function meta() {
  return [
    { title: "Regular Class — GWC Class Scheduling" },
    { name: "description", content: "Manage regular class schedules for the current academic term." },
  ];
}

export default function RegularClassRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean", "faculty"]}>
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

  // Term context — acts as the primary filter.
  const [schoolYear, setSchoolYear] = useState(DEFAULT_SCHOOL_YEAR);
  const [semester, setSemester] = useState<ScheduleSemester>(1);

  // Secondary filters.
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [yearLevelFilter, setYearLevelFilter] = useState<YearLevel | "all">("all");
  const [setFilter, setSetFilter] = useState("all");

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
    });
  }, []);

  const visibleSchedules = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.schedules
      .filter((s) => {
        if (s.schoolYear !== schoolYear || s.semester !== semester) return false;
        if (programFilter !== "all" && s.program !== programFilter) return false;
        if (yearLevelFilter !== "all" && s.yearLevel !== yearLevelFilter) return false;
        if (setFilter !== "all" && s.setCode !== setFilter) return false;
        if (
          query &&
          !s.subjectCode.toLowerCase().includes(query) &&
          !s.subjectTitle.toLowerCase().includes(query) &&
          !s.facultyName.toLowerCase().includes(query) &&
          !s.roomName.toLowerCase().includes(query) &&
          !s.setCode.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          a.program.localeCompare(b.program) ||
          a.yearLevel - b.yearLevel ||
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
          a.startTime.localeCompare(b.startTime),
      );
  }, [data, schoolYear, semester, search, programFilter, yearLevelFilter, setFilter]);

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
        title="Regular Class"
        description="Regular class schedules for the current academic term."
        actions={
          <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
            <PlusIcon />
            New Schedule
          </Button>
        }
      />

      {/* Term context bar */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <Select
            id="sched-year-ctx"
            label="School Year"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
          >
            {SCHOOL_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select
            id="sched-sem-ctx"
            label="Semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value) as ScheduleSemester)}
          >
            {SCHEDULE_SEMESTERS.map((s) => (
              <option key={s} value={s}>{SCHEDULE_SEMESTER_LABELS[s]}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Secondary filters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              id="sched-search"
              label="Search"
              type="search"
              placeholder="Subject, faculty, room, set…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            id="sched-program-filter"
            label="Program"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="all">All programs</option>
            {(data?.programs ?? []).map((p) => (
              <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
            ))}
          </Select>
          <Select
            id="sched-year-level-filter"
            label="Year Level"
            value={yearLevelFilter}
            onChange={(e) => setYearLevelFilter(e.target.value === "all" ? "all" : Number(e.target.value) as YearLevel)}
          >
            <option value="all">All year levels</option>
            {YEAR_LEVELS.map((yl) => (
              <option key={yl} value={yl}>{YEAR_LEVEL_LABELS[yl]}</option>
            ))}
          </Select>
          <Select
            id="sched-set-filter"
            label="Set"
            value={setFilter}
            onChange={(e) => setSetFilter(e.target.value)}
          >
            <option value="all">All sets</option>
            {[...new Set((data?.sets ?? []).map((s) => s.setCode))].sort().map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <div
            role="status"
            aria-label="Loading schedules"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleSchedules.length === 0 ? (
          <EmptyState title="No schedules found">
            No schedules match the current filters. Try adjusting the term or add a new schedule.
          </EmptyState>
        ) : (
          <ScheduleTable
            schedules={visibleSchedules}
            programs={data!.programs}
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
