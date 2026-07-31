import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "~/hooks/use-theme";
import type {
  CoverageByProgram,
  DailyLoadHour,
  InstructorLoad,
  LoadBand,
  Spread,
} from "~/types/dean-analytics";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

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
  badge,
  meterPercent,
}: {
  title: string;
  displayValue: string;
  unit?: string;
  hint?: string;
  tone?: string;
  badge?: string;
  meterPercent?: number;
}) {
  const color = chartStatusColor(tone);
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

// ── Curriculum coverage by program (horizontal stacked) ─────────────────────

export function CoverageStackedChart({ rows }: { rows: CoverageByProgram[] }) {
  const c = useChartColors();
  const data = rows.map((r) => ({
    program: r.program_abbrev,
    Staffed: r.staffed_subjects,
    Unstaffed: r.unstaffed_subjects,
  }));
  if (data.length === 0) {
    return <ChartEmpty message="No active programs in this department." />;
  }
  const height = Math.max(180, data.length * 44);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barSize={20}>
        <CartesianGrid horizontal={false} stroke={c.grid} />
        <XAxis type="number" tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="program" width={64} tick={{ fill: c.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: c.cursor }} content={<ChartTip formatter={(v) => `${v} subject${v === 1 ? "" : "s"}`} />} />
        <Legend
          formatter={(value) => <span className="text-xs text-slate-500 dark:text-slate-400">{value}</span>}
        />
        <Bar dataKey="Staffed" stackId="cov" fill={STATUS_COLORS.good} radius={[4, 0, 0, 4]} animationDuration={600} />
        <Bar dataKey="Unstaffed" stackId="cov" fill={STATUS_COLORS.serious} radius={[0, 4, 4, 0]} animationDuration={600} />
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
