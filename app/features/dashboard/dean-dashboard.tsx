import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { deanService } from "~/services/dean.service";
import type { BarChart, DeanAnalyticsResponse, MeterList, Section, StackedBar, StatTile, TableWidget, Widget } from "~/types/dean-analytics";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const EASE_BOUNCE = [0.34, 1.56, 0.64, 1] as const;

const staggerSections = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerInsights = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const staggerWidgets = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const staggerTableRows = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.02 } },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

const popCard = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE_OUT } },
};

const insightVariant = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE_OUT } },
};

function toneBg(tone: string): string {
  switch (tone) {
    case "good": return "rgba(12,163,12,0.1)";
    case "warning": return "rgba(250,178,25,0.15)";
    case "critical": return "rgba(208,59,59,0.1)";
    case "serious": return "rgba(236,131,90,0.1)";
    default: return "rgba(137,135,129,0.1)";
  }
}

function toneText(tone: string): string {
  switch (tone) {
    case "good": return "#0ca30c";
    case "warning": return "#b8890f";
    case "critical": return "#d03b3b";
    case "serious": return "#d06a3b";
    default: return "#898781";
  }
}

function toneBar(tone: string): string {
  switch (tone) {
    case "good": return "#0ca30c";
    case "warning": return "#fab219";
    case "critical": return "#d03b3b";
    case "serious": return "#ec835a";
    default: return "#2a78d6";
  }
}

function ordinalColor(role: string | undefined): string {
  switch (role) {
    case "ordinal_1": return "#86b6ef";
    case "ordinal_2": return "#5598e7";
    case "ordinal_3": return "#2a78d6";
    case "ordinal_4": return "#1c5cab";
    case "ordinal_5": return "#104281";
    default: return "#2a78d6";
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
            <Skeleton className="mb-3 h-3 w-1/3" />
            <Skeleton className="mb-2 h-8 w-1/2" />
            <Skeleton className="mb-3 h-3 w-1/4" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
            <div className="mb-3 flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-2.5 w-1/5" />
              </div>
            </div>
            <Skeleton className="mb-2 h-2.5 w-full" />
            <Skeleton className="mb-2 h-2.5 w-5/6" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function UpdateIndicator({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-navy-800 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-navy-600"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="size-3 rounded-full border-2 border-white border-t-transparent"
          />
          Updating…
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatTileWidget({ widget, index }: { widget: StatTile; index: number }) {
  return (
    <motion.div
      variants={popCard}
      whileHover={{ y: -3, boxShadow: "0 8px 25px -8px rgba(0,0,0,0.12)", transition: { duration: 0.2 } }}
      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-navy-900"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{widget.title}</span>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + index * 0.03, duration: 0.3, ease: EASE_OUT }}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: toneBg(widget.status.tone), color: toneText(widget.status.tone) }}
        >
          {widget.status.label}
        </motion.span>
      </div>
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 + index * 0.03, duration: 0.5, ease: EASE_BOUNCE }}
        className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
      >
        {widget.display_value}
      </motion.span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{widget.unit}</span>
      {widget.meter && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(widget.meter.percent, 100)}%` }}
            transition={{ delay: 0.2 + index * 0.03, duration: 0.8, ease: EASE_OUT }}
            className="h-full rounded-full"
            style={{ backgroundColor: widget.meter.percent > 100 ? "#d03b3b" : widget.meter.percent >= 90 ? "#ec835a" : widget.meter.percent >= 50 ? "#2a78d6" : "#86b6ef" }}
          />
        </div>
      )}
      {widget.hint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.03, duration: 0.4 }}
          className="text-[11px] leading-tight text-slate-400 dark:text-slate-500"
        >
          {widget.hint}
        </motion.p>
      )}
    </motion.div>
  );
}

function MeterListWidget({ widget }: { widget: MeterList }) {
  if (widget.rows.length === 0) {
    return (
      <motion.div variants={popCard} className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500">
        {widget.empty_state.message}
      </motion.div>
    );
  }
  return (
    <motion.div
      variants={popCard}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-navy-900"
    >
      <motion.h3
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200"
      >
        {widget.title}
      </motion.h3>
      {widget.subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06, duration: 0.3 }}
          className="mb-3 text-xs text-slate-500 dark:text-slate-400"
        >
          {widget.subtitle}
        </motion.p>
      )}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
        className="space-y-3"
      >
        {widget.rows.map((row) => {
          const pct = Math.min(row.percent, 100);
          return (
            <motion.div
              key={row.id}
              variants={slideLeft}
              whileHover={{ x: 3, transition: { duration: 0.15 } }}
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                <span className="text-slate-500 dark:text-slate-400">{row.display_value}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.06, duration: 0.6, ease: EASE_OUT }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: toneBar(row.status.tone) }}
                />
                {row.overflow && (
                  <div className="absolute right-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-red-500" />
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{row.secondary}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

function BarChartWidget({ widget }: { widget: BarChart }) {
  const data = widget.series[0]?.points ?? [];
  if (data.length === 0) {
    return (
      <motion.div variants={popCard} className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500">
        {widget.empty_state.message}
      </motion.div>
    );
  }
  const maxVal = Math.max(...data.map((p) => p.value), 1);
  const isHoriz = widget.orientation === "horizontal";
  return (
    <motion.div
      variants={popCard}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-navy-900"
    >
      <motion.h3
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200"
      >
        {widget.title}
      </motion.h3>
      {widget.subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06, duration: 0.3 }}
          className="mb-3 text-xs text-slate-500 dark:text-slate-400"
        >
          {widget.subtitle}
        </motion.p>
      )}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
        className={`space-y-2 ${isHoriz ? "" : "flex items-end gap-3"}`}
        style={isHoriz ? {} : { minHeight: 120 }}
      >
        {data.map((point) => (
          <motion.div
            key={point.label}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.3 } },
            }}
            className={isHoriz ? "flex items-center gap-2" : "flex flex-1 flex-col items-center"}
          >
            <div className={isHoriz ? "flex-1" : "flex w-full flex-col items-center"}>
              <motion.div
                initial={isHoriz ? { width: 0 } : { height: 0 }}
                animate={isHoriz ? { width: `${(point.value / maxVal) * 100}%` } : { height: `${(point.value / maxVal) * 100}%` }}
                transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.1 }}
                className={isHoriz ? "h-5 rounded-r" : "w-full rounded-t"}
                style={{ backgroundColor: ordinalColor(point.color_role), minWidth: isHoriz ? 4 : undefined, minHeight: isHoriz ? undefined : 4 }}
              />
              {point.direct_label && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                  className="mt-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400"
                >
                  {point.display_value}
                </motion.span>
              )}
            </div>
            <span className={`text-[10px] text-slate-500 dark:text-slate-400 ${isHoriz ? "w-16 shrink-0 text-right" : ""}`}>
              {isHoriz ? point.display_value : point.label}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function StackedBarWidget({ widget }: { widget: StackedBar }) {
  if (widget.categories.length === 0) {
    return (
      <motion.div variants={popCard} className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500">
        {widget.empty_state.message}
      </motion.div>
    );
  }
  const keys = widget.series.map((s) => s.key);
  const colorMap: Record<string, string> = {};
  for (const s of widget.series) {
    colorMap[s.key] = s.color_role === "series_1" ? "#2a78d6" :
      s.color_role === "series_2" ? "#eb6834" :
      s.color_role === "series_3" ? "#86b6ef" :
      s.color_role === "series_4" ? "#d9a05b" : "#5598e7";
  }
  return (
    <motion.div
      variants={popCard}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-navy-900"
    >
      <motion.h3
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200"
      >
        {widget.title}
      </motion.h3>
      {widget.subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06, duration: 0.3 }}
          className="mb-3 text-xs text-slate-500 dark:text-slate-400"
        >
          {widget.subtitle}
        </motion.p>
      )}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
        className="space-y-3"
      >
        {widget.categories.map((cat) => {
          const total = keys.reduce((s, k) => s + (cat.values[k] ?? 0), 0) || 1;
          return (
            <motion.div
              key={cat.label}
              variants={slideLeft}
              whileHover={{ x: 3, transition: { duration: 0.15 } }}
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">{cat.label}</span>
                <span className="text-slate-500 dark:text-slate-400">{cat.display_value}</span>
              </div>
              <div className="flex h-5 w-full overflow-hidden rounded bg-slate-200 dark:bg-white/10">
                {keys.map((key) => {
                  const w = (cat.values[key] ?? 0) / total * 100;
                  return w > 0 ? (
                    <motion.div
                      key={key}
                      initial={{ width: 0 }}
                      animate={{ width: `${w}%` }}
                      transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.08 }}
                      style={{ backgroundColor: colorMap[key] ?? "#2a78d6", minWidth: 4 }}
                    />
                  ) : null;
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

function TableWidgetRenderer({ widget }: { widget: TableWidget }) {
  if (widget.rows.length === 0) {
    return (
      <motion.div variants={popCard} className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500">
        {widget.empty_state.message}
      </motion.div>
    );
  }
  return (
    <motion.div
      variants={popCard}
      whileHover={{ y: -1, transition: { duration: 0.2 } }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-navy-900"
    >
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="border-b border-slate-200 px-4 py-3 dark:border-white/10"
      >
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{widget.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{widget.subtitle}</p>
      </motion.div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
            <tr>
              {widget.columns.map((col) => (
                <th key={col.key} className={`px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 ${col.align === "right" ? "text-right" : ""} ${col.key === "status" ? "text-center" : ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="visible"
            variants={staggerTableRows}
            className="divide-y divide-slate-100 dark:divide-white/5"
          >
            {widget.rows.map((row, i) => (
              <motion.tr
                key={i}
                variants={{ hidden: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: EASE_OUT } } }}
                className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                {widget.columns.map((col) => {
                  const val = row[col.key];
                  const cell = val != null ? String(val) : "";
                  const isStatusCol = col.key === "status" && row.status;
                  return (
                    <td key={col.key} className={`px-4 py-2 text-slate-700 dark:text-slate-300 ${col.align === "right" ? "text-right" : ""}`}>
                      {isStatusCol ? (
                        <span className="inline-flex items-center gap-1">
                          {row.status && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.02, duration: 0.2 }}
                              className="text-[10px] font-medium"
                              style={{ color: toneText(row.status.tone) }}
                            >
                              {row.status.label}
                            </motion.span>
                          )}
                        </span>
                      ) : (
                        col.suffix ? `${cell}${col.suffix}` : cell
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </motion.div>
  );
}

function WidgetRenderer({ widget, index }: { widget: Widget; index: number }) {
  switch (widget.kind) {
    case "stat_tile":
      return <StatTileWidget widget={widget} index={index} />;
    case "meter_list":
      return <MeterListWidget widget={widget} />;
    case "bar":
      return <BarChartWidget widget={widget} />;
    case "stacked_bar":
      return <StackedBarWidget widget={widget} />;
    case "table":
      return <TableWidgetRenderer widget={widget} />;
    default:
      return null;
  }
}

function SectionRenderer({ section }: { section: Section }) {
  if (section.layout === "kpi_row") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerWidgets}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {section.widgets.map((w, i) => <WidgetRenderer key={w.id} widget={w} index={i} />)}
      </motion.div>
    );
  }
  if (section.layout === "full") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerWidgets}
        className="space-y-4"
      >
        {section.widgets.map((w, i) => <WidgetRenderer key={w.id} widget={w} index={i} />)}
      </motion.div>
    );
  }
  const cols = section.columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerWidgets}
      className={`grid grid-cols-1 gap-4 ${cols}`}
    >
      {section.widgets.map((w, i) => <WidgetRenderer key={w.id} widget={w} index={i} />)}
    </motion.div>
  );
}

export function DeanDashboard() {
  const [data, setData] = useState<DeanAnalyticsResponse | null>(null);
  const [prevSy, setPrevSy] = useState<number>(0);
  const [prevSem, setPrevSem] = useState<number>(0);
  const [syId, setSyId] = useState<number>(0);
  const [semId, setSemId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [years, setYears] = useState<{ id: number; schoolYear: string }[]>([]);
  const [sems, setSems] = useState<{ id: number; semester: string; semesterNumber: number }[]>([]);

  const fetchTerms = useCallback(async () => {
    try {
      const { schoolYearService } = await import("~/services/school-year.service");
      const { semesterService } = await import("~/services/semester.service");
      const [y, s] = await Promise.all([
        schoolYearService.list(),
        semesterService.list(),
      ]);
      setYears(y);
      setSems(s);
      const current = y.at(0);
      const first = s.find((s) => s.semesterNumber !== 3) ?? s.at(0);
      if (current) setSyId(current.id);
      if (first) setSemId(first.id);
    } catch {
      setYears([]);
      setSems([]);
    }
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  useEffect(() => {
    if (!syId || !semId) return;
    let cancelled = false;
    const isInitial = !data;
    if (!isInitial) setRefreshing(true);
    if (isInitial) setLoading(true);
    setError(null);
    deanService.getAnalytics(syId, semId)
      .then((d) => {
        if (!cancelled) {
          setPrevSy(syId);
          setPrevSem(semId);
          setData(d);
        }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard data."); })
      .finally(() => {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      });
    return () => { cancelled = true; };
  }, [syId, semId]);

  const isSwitching = !loading && !refreshing && prevSy !== syId && prevSem !== semId;

  return (
    <div className="space-y-6">
      <UpdateIndicator visible={refreshing} />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <LoadingSkeleton />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
          >
            {error}
          </motion.div>
        ) : data ? (
          <motion.div
            key="data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              variants={staggerSections}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* ─── Header + term selects ─── */}
              <motion.div
                variants={fadeSlideUp}
                className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data.meta.title}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.meta.subtitle}</p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="flex shrink-0 gap-3"
                >
                  <div className="w-44">
                    <Select
                      items={years.map((y) => ({ value: String(y.id), label: y.schoolYear }))}
                      value={syId ? String(syId) : ""}
                      onValueChange={(v) => { if (v) setSyId(Number(v)); }}
                    >
                      <SelectTrigger id="dashboard-sy">
                        <SelectValue placeholder="School year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y.id} value={String(y.id)}>{y.schoolYear}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-44">
                    <Select
                      items={sems.map((s) => ({ value: String(s.id), label: s.semester }))}
                      value={semId ? String(semId) : ""}
                      onValueChange={(v) => { if (v) setSemId(Number(v)); }}
                    >
                      <SelectTrigger id="dashboard-sem">
                        <SelectValue placeholder="Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {sems.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.semester}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              </motion.div>

              {/* ─── Insights ─── */}
              {data.insights.length > 0 && (
                <motion.div variants={fadeSlideUp}>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerInsights}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  >
                  {data.insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      variants={insightVariant}
                      whileHover={{ y: -3, boxShadow: "0 8px 20px -8px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-navy-900"
                    >
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + i * 0.03, duration: 0.3 }}
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          color: insight.severity === "critical" ? "#d03b3b" :
                            insight.severity === "warning" ? "#b8890f" :
                            insight.severity === "info" ? "#2a78d6" : "#0ca30c",
                        }}
                      >
                        {insight.severity}
                      </motion.span>
                      <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{insight.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{insight.message}</p>
                      {insight.action && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 + i * 0.03, duration: 0.3 }}
                          className="mt-1 text-[11px] font-medium text-navy-600 dark:text-navy-400"
                        >
                          {insight.action}
                        </motion.p>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
                </motion.div>
              )}

              {/* ─── Sections ─── */}
              {data.sections.map((section) => (
                <motion.section key={section.id} variants={fadeSlideUp}>
                  {section.layout !== "kpi_row" && (
                    <motion.h3
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      className="mb-3 text-base font-bold text-slate-800 dark:text-slate-200"
                    >
                      {section.title}
                    </motion.h3>
                  )}
                  <SectionRenderer section={section} />
                </motion.section>
              ))}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
