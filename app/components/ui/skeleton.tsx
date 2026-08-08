import { motion } from "motion/react";

const shimmerSlide = {
  initial: { x: "-100%" },
  animate: { x: "200%", transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const } },
};

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-slate-200 dark:bg-white/8 ${className ?? ""}`}>
      <motion.div
        variants={shimmerSlide}
        initial="initial"
        animate="animate"
        className="absolute inset-y-0 w-full"
        style={{
          background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%)",
        }}
      />
    </div>
  );
}

type TableSkeletonProps = {
  /** How many columns the real table has — keeps the placeholder the same shape. */
  columns: number;
  /** Placeholder row count (default 6). */
  rows?: number;
};

/** Table-shaped loading placeholder — preserves layout so content doesn't jump
 * in on load, matching the shaped skeletons the dashboards already use.
 *
 * Rendered as a fluid grid (not the shared Table primitive) so the placeholder
 * fills its container exactly and never shows a horizontal scrollbar. */
export function TableSkeleton({ columns, rows = 6 }: TableSkeletonProps) {
  const gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  return (
    <div role="status" aria-label="Loading">
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        <div
          className="grid border-b-2 border-slate-300 bg-slate-50 dark:border-white/10 dark:bg-surface-raised"
          style={{ gridTemplateColumns }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="min-w-0 overflow-hidden px-4 py-2.5">
              <Skeleton className="h-3.5 w-16 max-w-full" />
            </div>
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid border-b border-slate-200 last:border-b-0 dark:border-white/8"
            style={{ gridTemplateColumns }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="min-w-0 overflow-hidden border-r border-slate-200 px-4 py-2.5 last:border-r-0 dark:border-white/8"
              >
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type CardGridSkeletonProps = {
  /** Placeholder card count (default 6). */
  cards?: number;
  /** Tailwind grid column classes matching the real grid (default 1/2/3 columns). */
  columns?: string;
};

/** Department directory loading placeholder — logo header, abbrev/name,
 * badges, an academic-programs bullet list, and a View Curriculum footer bar. */
export function CardGridSkeleton({
  cards = 6,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}: CardGridSkeletonProps) {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className={`grid gap-4 ${columns}`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-raised/80"
          >
            <Skeleton className="h-28 rounded-none" />
            <div className="flex flex-col gap-3 p-4">
              <div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <div>
                <Skeleton className="h-2.5 w-28" />
                <div className="mt-1.5 space-y-1.5 pl-4">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Facilities page loading placeholder — selected-building bar, stat row,
 * room filter bar, floor index, floor accordions with room cards, summary. */
export function FacilitiesSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-11 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-[minmax(180px,1.3fr)_repeat(4,minmax(0,1fr))]">
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 xl:col-span-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-9 w-full rounded-lg" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1.5 h-6 w-14" />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
            <Skeleton className="h-9 min-w-52 flex-1 rounded-lg lg:w-64 lg:flex-none" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[190px_minmax(0,1fr)_280px]">
          <div className="hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5 xl:block">
            <Skeleton className="h-4 w-20" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-end justify-between">
              <div>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="mt-1 h-3 w-48" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between px-1 py-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-6 rounded-md" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-24 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 xl:block">
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 space-y-2.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Manage-building page loading placeholder — heading, stat cards, floor
 * picker, room editor cards with form rows, and the summary panel. */
export function EditBuildingSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="flex flex-col gap-6 pb-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-1.5 h-4 w-80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <Skeleton className="h-4 w-16" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-1 h-3 w-16" />
              </div>
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 space-y-2.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type WizardSkeletonProps = {
  /** Number of stepper nodes to render (default 3). */
  steps?: number;
};

/** Wizard loading placeholder — stepper nodes above a form card and a
 * back/next action row. Used by the program, enrollment, and re-enroll flows. */
export function WizardSkeleton({ steps = 3 }: WizardSkeletonProps) {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {Array.from({ length: steps }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              {i < steps - 1 && <Skeleton className="h-0.5 w-16" />}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-raised/80">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg sm:col-span-2" />
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

const SCHEDULE_GRID_TEMPLATE = "5.75rem repeat(6, minmax(8.25rem, 1fr))";

type ScheduleSkeletonProps = {
  /** Number of time rows to render (default 6). */
  rows?: number;
};

/** Weekly timetable loading placeholder — day-header row plus the 6-day
 * session grid, each cell showing a session-card-sized bar. */
export function ScheduleSkeleton({ rows = 6 }: ScheduleSkeletonProps) {
  return (
    <div role="status" aria-label="Loading">
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        <div
          className="grid border-b-2 border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-surface-raised"
          style={{ gridTemplateColumns: SCHEDULE_GRID_TEMPLATE }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="border-r border-slate-200 px-3 py-3 dark:border-white/8">
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid" style={{ gridTemplateColumns: SCHEDULE_GRID_TEMPLATE }}>
            {Array.from({ length: 7 }).map((_, c) => (
              <div
                key={c}
                className="border-b border-r border-slate-200 p-2 last:border-r-0 dark:border-white/8"
              >
                {c === 0 ? (
                  <div className="flex flex-col items-center gap-1 py-2">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-2.5 w-7" />
                  </div>
                ) : (
                  <Skeleton className="h-12 w-full rounded-md" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Schedule builder loading placeholder — the context form (term/program/set
 * selects) above a view toggle and the weekly timetable. */
export function ScheduleBuilderSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-raised/80">
          <Skeleton className="h-5 w-44" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
        <ScheduleSkeleton rows={6} />
      </div>
    </div>
  );
}

type MappingSkeletonProps = {
  /** Number of room accordions to render (default 4). */
  rooms?: number;
};

/** Classroom mapping loading placeholder — per-room accordions, each with a
 * header and a day × time-slot grid. */
export function MappingSkeleton({ rooms = 4 }: MappingSkeletonProps) {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: rooms }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="bg-slate-200 p-2 dark:bg-white/8">
              <div className="grid grid-cols-6 gap-px">
                {Array.from({ length: 6 }).map((_, d) => (
                  <div key={d} className="bg-slate-50 py-2 dark:bg-navy-950">
                    <Skeleton className="mx-auto h-3 w-12" />
                  </div>
                ))}
              </div>
              {Array.from({ length: 4 }).map((_, r) => (
                <div key={r} className="grid grid-cols-6 gap-px">
                  {Array.from({ length: 6 }).map((_, c) => (
                    <div key={c} className="bg-white p-1.5 dark:bg-navy-950">
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type MobileScheduleSkeletonProps = {
  /** Number of subject cards to render (default 3). */
  rows?: number;
};

/** Mobile weekly schedule loading placeholder — the disclosure button above
 * subject cards with detail rows, mirroring MobileWeeklySchedule. */
export function MobileScheduleSkeleton({ rows = 3 }: MobileScheduleSkeletonProps) {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-lg" />
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-surface-raised/80"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-1.5 h-3.5 w-3/4" />
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-white/8">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="size-3.5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type AllocationListSkeletonProps = {
  /** Number of allocation cards to render (default 5). */
  rows?: number;
};

/** Weekly hour allocations loading placeholder — number tile, subject-type
 * line, lec/lab summary, and badges, mirroring WeeklyHourAllocationList. */
export function AllocationListSkeleton({ rows = 5 }: AllocationListSkeletonProps) {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <Skeleton className="mt-0.5 size-6 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="mt-1.5 h-3 w-2/3" />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Irregular students page loading placeholder — term filter card above the
 * three-pane layout (student list, student detail, assign panel). */
export function IrregularStudentsSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-md dark:border-white/10 dark:bg-white/5">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 space-y-2.5">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <Skeleton className="h-4 w-40" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lab analysis loading placeholder — verdict banner, KPI stat row, per-room
 * slot plates, and the consuming-subjects table. */
export function LabAnalysisSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <Skeleton className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <Skeleton className="size-4" />
              <Skeleton className="mt-2 h-3 w-20" />
              <Skeleton className="mt-1.5 h-5 w-12" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between px-1 py-1">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <Skeleton className="h-5 w-44" />
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="grid grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-3 w-12" />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="mt-3 h-3.5 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type TimelineSkeletonProps = {
  /** Number of step nodes to render (default 5). */
  steps?: number;
};

/** Term workflow loading placeholder — S.Y. header and a vertical step rail
 * with title/status lines, mirroring TermWorkflowTimeline. */
export function TimelineSkeleton({ steps = 5 }: TimelineSkeletonProps) {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true" className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex flex-col">
          {Array.from({ length: steps }).map((_, i) => (
            <div key={i} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <Skeleton className="size-9 rounded-full" />
                {i < steps - 1 && <Skeleton className="mt-1 h-10 w-0.5" />}
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-3.5 w-2/3" />
        </div>
      </div>
    </div>
  );
}
