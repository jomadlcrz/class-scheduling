import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { SlotsByDayChart } from "../../features/dashboard/slots-by-day-chart";
import { SlotsByProgramChart } from "../../features/dashboard/slots-by-program-chart";
import { CalendarIcon, LayersIcon, UsersIcon } from "../../components/ui/icons";
import { useAuth } from "../../hooks/use-auth";
import { PageHeader } from "../../layouts/page-header";
import { facultyService } from "../../services/faculty.service";
import { roomService } from "../../services/room.service";
import { scheduleService } from "../../services/schedule.service";
import { setService } from "../../services/set.service";
import { subjectService } from "../../services/subject.service";
import type { ChartConfig } from "../../components/ui/chart";
import type { Faculty } from "../../types/faculty";
import type { Room } from "../../types/room";
import {
  DAY_LABELS,
  DAYS,
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTER_LABELS,
  type Day,
  type Schedule,
  type ScheduleSemester,
} from "../../types/schedule";
import type { ClassSet } from "../../types/set";
import type { Subject } from "../../types/subject";

export function meta() {
  return [
    { title: "Dashboard — GWC Class Scheduling" },
    { name: "description", content: "Overview of the current academic term schedule." },
  ];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

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
  const schoolYear = DEFAULT_SCHOOL_YEAR;
  const semester: ScheduleSemester = 1;

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

  const activeFacultyCount = (data?.faculty ?? []).filter((f) => f.status === "active").length;

  const byDay = useMemo(() => {
    const counts: Partial<Record<Day, number>> = {};
    for (const s of termSchedules) counts[s.day] = (counts[s.day] ?? 0) + 1;
    return DAYS.map((d) => ({ day: DAY_LABELS[d].slice(0, 3), slots: counts[d] ?? 0 }));
  }, [termSchedules]);

  const byProgram = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of termSchedules) counts[s.program] = (counts[s.program] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([program, count], i) => ({
        program,
        count,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [termSchedules]);

  const pieConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = { count: { label: "Slots" } };
    for (const { program, fill } of byProgram) cfg[program] = { label: program, color: fill };
    return cfg;
  }, [byProgram]);

  const canManage = user?.role === "admin" || user?.role === "registrar";
  const isLoading = data === null;
  const hasData = termSchedules.length > 0;
  const areaSubtitle = `${schoolYear} · ${SCHEDULE_SEMESTER_LABELS[semester]}`;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={user ? `Welcome back, ${user.name}.` : "Overview of the current academic term."}
      />

      <div className="mt-6 flex flex-col gap-4">
        {isLoading ? (
          <SkeletonCards />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={<CalendarIcon />}
              label="Scheduled Slots"
              value={termSchedules.length}
              sub={SCHEDULE_SEMESTER_LABELS[semester]}
              accent="navy"
            />
            <KpiCard
              icon={<UsersIcon />}
              label="Active Faculty"
              value={activeFacultyCount}
              sub={`${data.faculty.length} total`}
              accent="emerald"
            />
            <KpiCard
              icon={<LayersIcon />}
              label="Class Sets"
              value={data.sets.length}
              sub="All programs"
              accent="gold"
            />
            <KpiCard
              icon={<CalendarIcon />}
              label="Subjects"
              value={data.subjects.length}
              sub={`${data.rooms.length} rooms available`}
              accent="sky"
            />
          </div>
        )}

        {isLoading ? (
          <SkeletonCharts />
        ) : !hasData ? (
          <EmptyTerm canManage={canManage} onNew={() => navigate("/schedules/new")} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <SlotsByDayChart data={byDay} subtitle={areaSubtitle} />
            <SlotsByProgramChart data={byProgram} config={pieConfig} />
          </div>
        )}
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

type KpiAccent = "navy" | "emerald" | "gold" | "sky";

const ACCENT_STYLES: Record<KpiAccent, { icon: string; value: string }> = {
  navy:    { icon: "bg-slate-100 text-navy-700 dark:bg-white/10 dark:text-white",                   value: "text-navy-700 dark:text-white"         },
  emerald: { icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", value: "text-emerald-700 dark:text-emerald-300" },
  gold:    { icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",         value: "text-amber-700 dark:text-amber-300"    },
  sky:     { icon: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",                value: "text-sky-700 dark:text-sky-300"        },
};

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  accent: KpiAccent;
}) {
  const s = ACCENT_STYLES[accent];
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`grid size-8 place-items-center rounded-lg ${s.icon}`}>{icon}</div>
      </div>
      <div>
        <p className={`font-display text-3xl tracking-wide ${s.value}`}>{value}</p>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            <div className="size-8 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
          </div>
          <div>
            <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="mb-1 h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        <div className="mb-4 h-3 w-56 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        <div className="h-62.5 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-white/5" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="mb-1 h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        <div className="mb-4 h-3 w-44 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        <div className="h-62.5 w-full animate-pulse rounded-full bg-slate-100 dark:bg-white/5" />
      </div>
    </div>
  );
}

function EmptyTerm({ canManage, onNew }: { canManage: boolean; onNew: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center dark:border-white/10">
      <p className="font-medium text-slate-500 dark:text-slate-400">
        No schedules for this term yet.
      </p>
      {canManage && (
        <button
          type="button"
          onClick={onNew}
          className="mt-2 cursor-pointer text-sm text-navy-700 underline underline-offset-2 hover:text-navy-500 dark:text-sky-400 dark:hover:text-sky-300"
        >
          Create the first schedule
        </button>
      )}
    </div>
  );
}
