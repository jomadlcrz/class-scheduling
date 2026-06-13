import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { PlusIcon } from "../../components/ui/icons";
import { Select } from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import { useAuth } from "../../hooks/use-auth";
import { PageHeader } from "../../layouts/page-header";
import { facultyService } from "../../services/faculty.service";
import { roomService } from "../../services/room.service";
import { scheduleService } from "../../services/schedule.service";
import { setService } from "../../services/set.service";
import { subjectService } from "../../services/subject.service";
import type { Faculty } from "../../types/faculty";
import type { Room } from "../../types/room";
import {
  DAY_LABELS,
  DAYS,
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTER_LABELS,
  SCHEDULE_SEMESTERS,
  SCHOOL_YEARS,
  type Day,
  type Schedule,
  type ScheduleSemester,
} from "../../types/schedule";
import type { ClassSet } from "../../types/set";
import type { Subject } from "../../types/subject";

export function meta() {
  return [
    { title: "Dashboard — GWC Class Scheduling" },
    { name: "description", content: "Your GWC Class Scheduling dashboard." },
  ];
}

type PageData = {
  schedules: Schedule[];
  sets: ClassSet[];
  subjects: Subject[];
  faculty: Faculty[];
  rooms: Room[];
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<PageData | null>(null);
  const [schoolYear, setSchoolYear] = useState(DEFAULT_SCHOOL_YEAR);
  const [semester, setSemester] = useState<ScheduleSemester>(1);

  useEffect(() => {
    Promise.all([
      scheduleService.list(),
      setService.list(),
      subjectService.list(),
      facultyService.list(),
      roomService.list(),
    ]).then(([schedules, sets, subjects, faculty, rooms]) => {
      setData({ schedules, sets, subjects, faculty, rooms });
    });
  }, []);

  const termSchedules = useMemo(
    () =>
      (data?.schedules ?? []).filter(
        (s) => s.schoolYear === schoolYear && s.semester === semester,
      ),
    [data, schoolYear, semester],
  );

  const byDay = useMemo(() => {
    const counts: Partial<Record<Day, number>> = {};
    for (const s of termSchedules) {
      counts[s.day] = (counts[s.day] ?? 0) + 1;
    }
    return DAYS.map((d) => ({ day: d, count: counts[d] ?? 0 })).filter((r) => r.count > 0);
  }, [termSchedules]);

  const activeFacultyCount = (data?.faculty ?? []).filter((f) => f.status === "active").length;

  const canManage = user?.role === "admin" || user?.role === "registrar";

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={user ? `Welcome back, ${user.name}.` : undefined}
        actions={
          canManage ? (
            <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
              <PlusIcon />
              New Schedule
            </Button>
          ) : undefined
        }
      />

      {/* Term selector */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <Select
            id="dash-year"
            label="School Year"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
          >
            {SCHOOL_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select
            id="dash-sem"
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

      {data === null ? (
        <div
          role="status"
          aria-label="Loading"
          className="mt-6 grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Scheduled Slots"
              value={termSchedules.length}
              sub={`${schoolYear} · ${SCHEDULE_SEMESTER_LABELS[semester]}`}
            />
            <StatCard
              label="Sets"
              value={data.sets.length}
              sub="Total class sections"
            />
            <StatCard
              label="Active Faculty"
              value={activeFacultyCount}
              sub={`of ${data.faculty.length} total`}
            />
            <StatCard
              label="Rooms"
              value={data.rooms.length}
              sub={`${data.subjects.length} subjects`}
            />
          </div>

          {/* Breakdown by day */}
          {byDay.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
              <h2 className="mb-4 font-display text-base tracking-wide text-navy-700 dark:text-white">
                Slots by Day
              </h2>
              <div className="flex flex-col gap-2">
                {byDay.map(({ day, count }) => {
                  const pct = Math.round((count / termSchedules.length) * 100);
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-sm text-slate-600 dark:text-slate-300">
                        {DAY_LABELS[day]}
                      </span>
                      <div className="min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div
                          className="h-2 rounded-full bg-navy-700 dark:bg-gold-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm font-medium text-navy-700 dark:text-white">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {termSchedules.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-white/10">
              <p className="font-medium text-slate-500 dark:text-slate-400">
                No schedules for this term yet.
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => navigate("/schedules/new")}
                  className="mt-2 cursor-pointer text-sm text-navy-700 underline underline-offset-2 hover:text-navy-500 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  Create the first schedule
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
      <p className="text-sm text-slate-500 dark:text-navy-300">{label}</p>
      <p className="mt-1 font-display text-3xl tracking-wide text-navy-700 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{sub}</p>
    </div>
  );
}
