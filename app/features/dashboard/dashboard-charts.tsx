import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "~/hooks/use-theme";
import { EASE_OUT } from "~/features/dashboard/dashboard-shared";
import type {
  CoverageByProgram,
  DailyLoadHour,
  InstructorLoad,
  LoadBand,
  Spread,
} from "~/types/dean-analytics";
import type {
  DepartmentStaffing,
  Enrollment,
  LabSummary,
  ScheduleCompletionProgram,
} from "~/types/registrar-analytics";

/** Status tones — the same four status meanings everywhere (tiles, meters,
 * table severity), always accompanied by a label in the UI. */
export const STATUS_COLORS: Record<string, string> = {
  good: "#2f9e63",
  warning: "#d9a026",
  serious: "#e0744a",
  critical: "#d64545",
  neutral: "#8b8f9c",
};

/** One-hue ordinal ramp for the load bands, plus a neutral for Unassigned. */
const BAND_FILLS: Record<string, string> = {
  Unassigned: "var(--color-slate-300)",
  Light: "var(--color-navy-300)",
  Healthy: "var(--color-navy-400)",
  Full: "var(--color-navy-500)",
  "Over cap": "var(--color-navy-600)",
};

export function chartStatusColor(tone: string): string {
  return STATUS_COLORS[tone] ?? STATUS_COLORS.neutral;
}

/** Load band ladder — the same thresholds the backend uses for its bands. */
export function loadBandTone(pct: number): string {
  if (pct > 100) return "critical";
  if (pct >= 90) return "serious";
  if (pct >= 50) return "good";
  if (pct > 0) return "warning";
  return "neutral";
}

/** A higher-is-better ratio: >=90 on track, >=50 watch, below needs attention. */
export function ratioTone(pct: number): string {
  if (pct >= 90) return "good";
  if (pct >= 50) return "warning";
  return "serious";
}

function useChartColors() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    tick: dark ? "var(--color-mist-100)" : "var(--color-slate-500)",
    grid: dark ? "rgba(232,234,241,0.08)" : "rgba(15,23,42,0.08)",
    cursor: dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    tooltipClass: dark ? "bg-surface-overlay" : "bg-white",
    tooltipBorder: dark ? "border-white/10" : "border-slate-200",
    label: dark ? "text-mist-100" : "text-slate-700",
    muted: dark ? "text-slate-400" : "text-slate-500",
    strong: dark ? "var(--color-mist-100)" : "var(--color-slate-800)",
  };
}

// ── Shared chrome ───────────────────────────────────────────────────────────

type TooltipItem = {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartTipProps = {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
  formatter?: (value: number) => string;
};

function ChartTip({ active, payload, label, formatter }: ChartTipProps) {
  const c = useChartColors();
  if (!active || !payload?.length) return null;
  return (
    <div
      className={`grid min-w-32 gap-1 rounded-lg border px-3 py-2 text-xs shadow-xl ${c.tooltipBorder} ${c.tooltipClass}`}
    >
      {label != null && <p className={`font-medium ${c.label}`}>{label}</p>}
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: item.color ?? "currentColor" }}
          />
          <span className={c.muted}>{item.name ?? "value"}</span>
          <span className={`ml-auto font-medium tabular-nums ${c.label}`}>
            {formatter ? formatter(Number(item.value)) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-navy-900 ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
      <div className="mt-3">{children}</div>
    </motion.div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-44 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
      {message}
    </div>
  );
}

// ── KPI tile ────────────────────────────────────────────────────────────────

export function StatTile({
  title,
  displayValue,
  unit,
  hint,
  tone = "neutral",
  color: colorOverride,
  badge,
  meterPercent,
}: {
  title: string;
  displayValue: string;
  unit?: string;
  hint?: string;
  tone?: string;
  /** Explicit hex color, e.g. to carry a group's own identity (Irregular's
   * indigo/amber) instead of the shared good/warning/critical ladder. Takes
   * precedence over `tone` when set. */
  color?: string;
  badge?: string;
  meterPercent?: number;
}) {
  const color = colorOverride ?? chartStatusColor(tone);
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.94 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE_OUT } },
      }}
      whileHover={{
        y: -3,
        boxShadow: "0 8px 25px -8px rgba(0,0,0,0.12)",
        transition: { duration: 0.2 },
      }}
      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-navy-900"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{title}</span>
        {badge && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            {badge}
          </motion.span>
        )}
      </div>
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
      >
        {displayValue}
      </motion.span>
      {unit && <span className="text-xs text-slate-500 dark:text-slate-400">{unit}</span>}
      {meterPercent != null && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(meterPercent, 100)}%` }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      )}
      {hint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-[11px] leading-tight text-slate-400 dark:text-slate-500"
        >
          {hint}
        </motion.p>
      )}
    </motion.div>
  );
}

// ── Load bands (horizontal bar, ordinal ramp) ───────────────────────────────

export function LoadBandChart({ bands }: { bands: LoadBand[] }) {
  const c = useChartColors();
  const data = bands.map((b) => ({ name: b.band, count: b.count, description: b.description }));
  if (data.every((d) => d.count === 0)) {
    return <ChartEmpty message="No instructors in the roster for this term." />;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }} barSize={18}>
        <CartesianGrid horizontal={false} stroke={c.grid} />
        <XAxis type="number" tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={86} tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: c.cursor }}
          content={<ChartTip formatter={(v) => `${v} instructor${v === 1 ? "" : "s"}`} />}
        />
        <Bar dataKey="count" name="Instructors" radius={[0, 4, 4, 0]} animationDuration={600}>
          {data.map((d) => (
            <Cell key={d.name} fill={BAND_FILLS[d.name] ?? STATUS_COLORS.neutral} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: c.tick, fontSize: 11, fontWeight: 600 }}
            formatter={(v) => (Number(v) > 0 ? String(v) : "")}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Booked hours by day (vertical bar, one hue, peak highlighted) ───────────

export function DailyHoursChart({ days }: { days: DailyLoadHour[] }) {
  const c = useChartColors();
  const data = days.map((d) => ({ name: d.day_name, hours: d.hours }));
  const max = Math.max(...data.map((d) => d.hours), 0);
  if (data.every((d) => d.hours === 0)) {
    return <ChartEmpty message="No sessions are booked for this term yet." />;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 22, right: 8, left: -14, bottom: 0 }} barSize={34}>
        <CartesianGrid vertical={false} stroke={c.grid} />
        <XAxis dataKey="name" tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
        <YAxis tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: c.cursor }} content={<ChartTip formatter={(v) => `${v} h`} />} />
        <Bar dataKey="hours" name="Hours" radius={[6, 6, 0, 0]} animationDuration={600}>
          {data.map((d) => (
            <Cell
              key={d.name}
              fill={d.hours === max && max > 0 ? "var(--color-gold-500)" : "var(--color-navy-500)"}
            />
          ))}
          <LabelList
            dataKey="hours"
            position="top"
            style={{ fill: c.tick, fontSize: 11, fontWeight: 600 }}
            formatter={(v) => (Number(v) > 0 ? `${v}h` : "")}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Horizontal stacked bar rows (generic, used by both dashboards) ──────────

export type StackedBarSeries = { key: string; label: string; color: string };

export function StackedBarRows({
  data,
  yKey,
  categoryWidth = 64,
  series,
  valueFormatter,
}: {
  data: Record<string, string | number>[];
  yKey: string;
  categoryWidth?: number;
  series: StackedBarSeries[];
  valueFormatter?: (v: number) => string;
}) {
  const c = useChartColors();
  if (data.length === 0) {
    return <ChartEmpty message="No data for this term." />;
  }
  const height = Math.max(180, data.length * 44);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barSize={20}>
        <CartesianGrid horizontal={false} stroke={c.grid} />
        <XAxis type="number" tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey={yKey} width={categoryWidth} tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: c.cursor }} content={<ChartTip formatter={valueFormatter} />} />
        <Legend
          formatter={(value) => <span className="text-xs text-slate-500 dark:text-slate-400">{value}</span>}
        />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId="stack"
            fill={s.color}
            radius={series.length === 1 ? [4, 4, 4, 4] : i === 0 ? [4, 0, 0, 4] : i === series.length - 1 ? [0, 4, 4, 0] : 0}
            animationDuration={600}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CoverageStackedChart({ rows }: { rows: CoverageByProgram[] }) {
  const data = rows.map((r) => ({
    program: r.program_abbrev,
    Staffed: r.staffed_subjects,
    Unstaffed: r.unstaffed_subjects,
  }));
  return (
    <StackedBarRows
      data={data}
      yKey="program"
      series={[
        { key: "Staffed", label: "Staffed", color: STATUS_COLORS.good },
        { key: "Unstaffed", label: "Unstaffed", color: STATUS_COLORS.serious },
      ]}
      valueFormatter={(v) => `${v} subject${v === 1 ? "" : "s"}`}
    />
  );
}

export function ScheduleCompletionChart({ programs }: { programs: ScheduleCompletionProgram[] }) {
  const data = programs.map((p) => ({
    program: p.program_abbrev,
    Scheduled: p.scheduled_sets,
    Unscheduled: p.unscheduled_sets,
  }));
  return (
    <StackedBarRows
      data={data}
      yKey="program"
      series={[
        { key: "Scheduled", label: "Scheduled", color: STATUS_COLORS.good },
        { key: "Unscheduled", label: "Unscheduled", color: STATUS_COLORS.serious },
      ]}
      valueFormatter={(v) => `${v} set${v === 1 ? "" : "s"}`}
    />
  );
}

// ── Enrollment donut ─────────────────────────────────────────────────────────

/** A rotating fallback ramp for any status label the color rules below don't
 * recognize, so a category the backend adds later still renders distinctly
 * instead of falling back to a single flat color. */
const DONUT_FALLBACK_RAMP = [
  "var(--color-navy-500)",
  "var(--color-navy-300)",
  "#8b8f9c",
  "#5b6472",
];

/** Irregular gets its own hue ("Midnight Cram") instead of a lighter shade of
 * Regular's green/amber — deep indigo for seated, amber glow for pending.
 * Shared with the "Not yet scheduled" tiles below so the same group reads
 * the same color everywhere on this dashboard. */
export const IRREGULAR_SEATED = "#4c3fa0";
export const IRREGULAR_PENDING = "#e8a23d";

/** This chart answers ONE question — who is enrolled, at all — so every
 * status_breakdown row collapses into its top-level enrollment bucket
 * ("Regular — seated"/"Regular — pending" both count as "Regular"). Seating
 * status (seated vs pending) is a different question, answered by the
 * separate "Not yet scheduled" section — mixing the two into one chart was
 * confusing. A category the backend adds later still lands in the right
 * bucket without a frontend change, as long as its label says which group it
 * belongs to. */
function enrollmentGroupOf(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("not") && s.includes("enrolled")) return "Not yet enrolled";
  if (s.includes("irregular")) return "Irregular";
  if (s.includes("regular")) return "Regular";
  return status;
}

const ENROLLMENT_GROUP_COLORS: Record<string, string> = {
  "Not yet enrolled": STATUS_COLORS.critical,
  Regular: STATUS_COLORS.good,
  Irregular: IRREGULAR_SEATED,
};

export function EnrollmentDonut({ enrollment }: { enrollment: Enrollment }) {
  const c = useChartColors();
  const totals = new Map<string, number>();
  for (const row of enrollment.status_breakdown) {
    const group = enrollmentGroupOf(row.status);
    totals.set(group, (totals.get(group) ?? 0) + row.count);
  }
  const data = Array.from(totals, ([name, value], i) => ({
    name,
    value,
    color: ENROLLMENT_GROUP_COLORS[name] ?? DONUT_FALLBACK_RAMP[i % DONUT_FALLBACK_RAMP.length],
  }));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <ChartEmpty message="No active students on the roster." />;
  }
  return (
    <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={76}
              paddingAngle={3}
              cornerRadius={6}
              strokeWidth={0}
              animationDuration={600}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTip formatter={(v) => `${v} student${v === 1 ? "" : "s"}`} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            on roster
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600 dark:text-slate-400">{d.name}</span>
            <span className={`ml-4 font-medium tabular-nums ${c.label}`}>{d.value}</span>
          </div>
        ))}
        {enrollment.not_enrolled_count > 0 && (
          <p className={`pt-1 text-[11px] ${c.muted}`}>
            {enrollment.not_enrolled_count} student
            {enrollment.not_enrolled_count === 1 ? " hasn't" : "s haven't"} enrolled yet
          </p>
        )}
      </div>
    </div>
  );
}

// ── Lab capacity meters ──────────────────────────────────────────────────────

export function LabCapacityMeters({
  laboratories,
  limit = 8,
}: {
  laboratories: LabSummary[];
  limit?: number;
}) {
  if (laboratories.length === 0) {
    return <ChartEmpty message="No lab rooms configured for this term." />;
  }
  const shown = laboratories.slice(0, limit);
  const overflow = laboratories.length - shown.length;
  return (
    <div className="space-y-3">
      {shown.map((lab, i) => {
        const pct = Math.min(lab.hour_utilization_percent, 100);
        const color = chartStatusColor(loadBandTone(lab.hour_utilization_percent));
        return (
          <motion.div
            key={lab.room_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.3, ease: EASE_OUT }}
            whileHover={{ x: 3, transition: { duration: 0.15 } }}
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                {lab.room_name}
              </span>
              <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                {lab.hour_utilization_percent}% · {lab.booked_hours} h
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.05 * i, duration: 0.6, ease: EASE_OUT }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
              {lab.is_fully_booked && (
                <div className="absolute right-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-red-500" />
              )}
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              {lab.building}
              {lab.is_fully_booked
                ? " · fully booked"
                : ` · ${Math.max(lab.window_capacity_hours - lab.booked_hours, 0)} h free`}
            </p>
          </motion.div>
        );
      })}
      {overflow > 0 && (
        <p className="pt-1 text-center text-[11px] text-slate-400 dark:text-slate-500">
          +{overflow} more labs.
        </p>
      )}
    </div>
  );
}

// ── Teaching capacity by department ──────────────────────────────────────────

export function StaffingByDepartmentChart({ departments }: { departments: DepartmentStaffing[] }) {
  const c = useChartColors();
  const data = departments.map((d) => ({
    name: d.department_abbrev,
    pct: d.capacity_used_percent,
    fill: chartStatusColor(loadBandTone(d.capacity_used_percent)),
  }));
  if (data.length === 0) {
    return <ChartEmpty message="No active departments configured." />;
  }
  const height = Math.max(180, data.length * 44);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 44, top: 4, bottom: 4 }} barSize={20}>
        <CartesianGrid horizontal={false} stroke={c.grid} />
        <XAxis type="number" unit="%" tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={64} tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: c.cursor }} content={<ChartTip formatter={(v) => `${v}%`} />} />
        <Bar dataKey="pct" name="Capacity used" radius={[0, 4, 4, 0]} animationDuration={600}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.fill} />
          ))}
          <LabelList
            dataKey="pct"
            position="right"
            style={{ fill: c.tick, fontSize: 11, fontWeight: 600 }}
            formatter={(v) => `${v}%`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Instructor load meters ──────────────────────────────────────────────────

const BAND_TONES: Record<string, string> = {
  Unassigned: "neutral",
  Light: "warning",
  Healthy: "good",
  Full: "serious",
  "Over cap": "critical",
};

export function InstructorLoadMeters({
  loads,
  limit = 8,
}: {
  loads: InstructorLoad[];
  limit?: number;
}) {
  if (loads.length === 0) {
    return <ChartEmpty message="No teaching terms exist for this term." />;
  }
  const shown = loads.slice(0, limit);
  const overflow = loads.length - shown.length;
  return (
    <div className="space-y-3">
      {shown.map((load, i) => {
        const pct = Math.min(load.load_percent, 100);
        const tone = BAND_TONES[load.load_band] ?? "neutral";
        const color = chartStatusColor(tone);
        return (
          <motion.div
            key={load.instructor_profile_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.3, ease: EASE_OUT }}
            whileHover={{ x: 3, transition: { duration: 0.15 } }}
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                {load.instructor_name}
              </span>
              <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                {load.booked_hours} / {load.max_weekly_hours} h
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.05 * i, duration: 0.6, ease: EASE_OUT }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
              {load.over_cap && (
                <div className="absolute right-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-red-500" />
              )}
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              {load.load_band}
              {load.max_weekly_hours > 0 && !load.over_cap && load.remaining_hours >= 0
                ? ` · ${load.remaining_hours} h left`
                : ""}
            </p>
          </motion.div>
        );
      })}
      {overflow > 0 && (
        <p className="pt-1 text-center text-[11px] text-slate-400 dark:text-slate-500">
          +{overflow} more — the full list ships in the attention table.
        </p>
      )}
    </div>
  );
}

// ── Load spread ─────────────────────────────────────────────────────────────

export function SpreadCard({ spread }: { spread: Spread }) {
  const c = useChartColors();
  const evennessColor =
    spread.evenness === "Evenly shared"
      ? STATUS_COLORS.good
      : spread.evenness === "Somewhat uneven"
        ? STATUS_COLORS.warning
        : STATUS_COLORS.critical;
  const stats = [
    { label: "Median load", value: `${spread.median_load_percent}%` },
    { label: "Top decile (p90)", value: `${spread.p90_load_percent}%` },
    { label: "Evenness", value: spread.evenness, color: evennessColor },
    { label: "Variation (CV)", value: `${spread.coefficient_of_variation_percent}%` },
  ];
  return (
    <ChartCard title="Load spread" subtitle="How fairly booked hours are shared across instructors">
      <div className="flex h-44 flex-col justify-center gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.35, ease: EASE_OUT }}
            className="flex items-baseline justify-between gap-3"
          >
            <span className={`text-xs ${c.muted}`}>{s.label}</span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: s.color ?? c.strong }}
            >
              {s.value}
            </span>
          </motion.div>
        ))}
      </div>
    </ChartCard>
  );
}
