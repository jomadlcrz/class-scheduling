import { useCallback, useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { deanService } from "~/services/dean.service";
import type { DeanAnalyticsResponse, Section, Widget, StatTile, MeterList, BarChart, StackedBar, TableWidget, Insight } from "~/types/dean-analytics";

function StatTileWidget({ widget }: { widget: StatTile }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{widget.title}</span>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: widget.status.tone === "good" ? "rgba(12,163,12,0.1)" :
              widget.status.tone === "warning" ? "rgba(250,178,25,0.15)" :
              widget.status.tone === "critical" ? "rgba(208,59,59,0.1)" :
              widget.status.tone === "serious" ? "rgba(236,131,90,0.1)" : "rgba(137,135,129,0.1)",
            color: widget.status.tone === "good" ? "#0ca30c" :
              widget.status.tone === "warning" ? "#b8890f" :
              widget.status.tone === "critical" ? "#d03b3b" :
              widget.status.tone === "serious" ? "#d06a3b" : "#898781",
          }}
        >
          {widget.status.label}
        </span>
      </div>
      <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {widget.display_value}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{widget.unit}</span>
      {widget.meter && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(widget.meter.percent, 100)}%`,
              backgroundColor: widget.meter.percent > 100 ? "#d03b3b" :
                widget.meter.percent >= 90 ? "#ec835a" :
                widget.meter.percent >= 50 ? "#2a78d6" : "#86b6ef",
            }}
          />
        </div>
      )}
      {widget.hint && (
        <p className="text-[11px] leading-tight text-slate-400 dark:text-slate-500">{widget.hint}</p>
      )}
    </div>
  );
}

function MeterListWidget({ widget }: { widget: MeterList }) {
  if (widget.rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500">
        {widget.empty_state.message}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
      <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{widget.title}</h3>
      {widget.subtitle && <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{widget.subtitle}</p>}
      <div className="space-y-3">
        {widget.rows.map((row) => {
          const pct = Math.min(row.percent, 100);
          const barColor = row.status.tone === "good" ? "#0ca30c" :
            row.status.tone === "warning" ? "#fab219" :
            row.status.tone === "critical" ? "#d03b3b" :
            row.status.tone === "serious" ? "#ec835a" : "#2a78d6";
          return (
            <div key={row.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                <span className="text-slate-500 dark:text-slate-400">{row.display_value}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                {row.overflow && (
                  <div className="absolute right-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-red-500" />
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{row.secondary}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarChartWidget({ widget }: { widget: BarChart }) {
  const data = widget.series[0]?.points ?? [];
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500">
        {widget.empty_state.message}
      </div>
    );
  }
  const maxVal = Math.max(...data.map((p) => p.value), 1);
  const isHoriz = widget.orientation === "horizontal";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
      <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{widget.title}</h3>
      {widget.subtitle && <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{widget.subtitle}</p>}
      <div className={`space-y-2 ${isHoriz ? "" : "flex items-end gap-3"}`} style={isHoriz ? {} : { minHeight: 120 }}>
        {data.map((point) => (
          <div key={point.label} className={isHoriz ? "flex items-center gap-2" : "flex flex-1 flex-col items-center"}>
            <div className={isHoriz ? "flex-1" : "flex w-full flex-col items-center"}>
              <div
                className={isHoriz ? "h-5 rounded-r" : "w-full rounded-t"}
                style={{
                  [isHoriz ? "width" : "height"]: `${(point.value / maxVal) * 100}%`,
                  backgroundColor: point.color_role === "ordinal_1" ? "#86b6ef" :
                    point.color_role === "ordinal_2" ? "#5598e7" :
                    point.color_role === "ordinal_3" ? "#2a78d6" :
                    point.color_role === "ordinal_4" ? "#1c5cab" :
                    point.color_role === "ordinal_5" ? "#104281" : "#2a78d6",
                  minWidth: isHoriz ? 4 : undefined,
                  minHeight: isHoriz ? undefined : 4,
                }}
              />
              {point.direct_label && (
                <span className="mt-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  {point.display_value}
                </span>
              )}
            </div>
            <span className={`text-[10px] text-slate-500 dark:text-slate-400 ${isHoriz ? "w-16 text-right" : ""}`}>
              {isHoriz ? point.display_value : point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackedBarWidget({ widget }: { widget: StackedBar }) {
  if (widget.categories.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500">
        {widget.empty_state.message}
      </div>
    );
  }
  const keys = widget.series.map((s) => s.key);
  const colorMap = Object.fromEntries(widget.series.map((s) => [s.key, s.color_role === "series_1" ? "#2a78d6" : "#eb6834"]));
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
      <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{widget.title}</h3>
      {widget.subtitle && <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{widget.subtitle}</p>}
      <div className="space-y-3">
        {widget.categories.map((cat) => {
          const total = keys.reduce((s, k) => s + (cat.values[k] ?? 0), 0) || 1;
          return (
            <div key={cat.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">{cat.label}</span>
                <span className="text-slate-500 dark:text-slate-400">{cat.display_value}</span>
              </div>
              <div className="flex h-5 w-full overflow-hidden rounded bg-slate-200 dark:bg-white/10">
                {keys.map((key) => {
                  const w = (cat.values[key] ?? 0) / total * 100;
                  return w > 0 ? (
                    <div key={key} style={{ width: `${w}%`, backgroundColor: colorMap[key], minWidth: 4 }} />
                  ) : null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TableWidgetRenderer({ widget }: { widget: TableWidget }) {
  if (widget.rows.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500">
        {widget.empty_state.message}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{widget.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{widget.subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
            <tr>
              {widget.columns.map((col) => (
                <th key={col.key} className={`px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 ${col.align === "right" ? "text-right" : ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {widget.rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                {widget.columns.map((col) => {
                  const val = row[col.key];
                  const cell = val != null ? String(val) : "";
                  const isStatusCol = col.key === "status" && row.status;
                  return (
                    <td key={col.key} className={`px-4 py-2 text-slate-700 dark:text-slate-300 ${col.align === "right" ? "text-right" : ""}`}>
                      {isStatusCol ? (
                        <span className="inline-flex items-center gap-1">
                          {row.status && (
                            <span className="text-[10px] font-medium" style={{
                              color: row.status.tone === "good" ? "#0ca30c" :
                                row.status.tone === "warning" ? "#b8890f" :
                                row.status.tone === "critical" ? "#d03b3b" :
                                row.status.tone === "serious" ? "#d06a3b" : "#898781",
                            }}>
                              {row.status.label}
                            </span>
                          )}
                        </span>
                      ) : (
                        col.suffix ? `${cell}${col.suffix}` : cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WidgetRenderer({ widget }: { widget: Widget }) {
  switch (widget.kind) {
    case "stat_tile":
      return <StatTileWidget widget={widget} />;
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.widgets.map((w) => <WidgetRenderer key={w.id} widget={w} />)}
      </div>
    );
  }
  if (section.layout === "full") {
    return (
      <div className="space-y-4">
        {section.widgets.map((w) => <WidgetRenderer key={w.id} widget={w} />)}
      </div>
    );
  }
  const cols = section.columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols}`}>
      {section.widgets.map((w) => <WidgetRenderer key={w.id} widget={w} />)}
    </div>
  );
}

export function DeanDashboard() {
  const [data, setData] = useState<DeanAnalyticsResponse | null>(null);
  const [syId, setSyId] = useState<number>(0);
  const [semId, setSemId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);
    setError(null);
    deanService.getAnalytics(syId, semId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard data."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [syId, semId]);

  if (data) {
    const matchedSy = years.find((y) => y.id === syId);
    const matchedSem = sems.find((s) => s.id === semId);
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data.meta.title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.meta.subtitle}</p>
          </div>
          <div className="flex shrink-0 gap-3">
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
          </div>
        </div>

        {data.insights.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.insights.map((insight, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900">
                <span className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    color: insight.severity === "critical" ? "#d03b3b" :
                      insight.severity === "warning" ? "#b8890f" :
                      insight.severity === "info" ? "#2a78d6" : "#0ca30c",
                  }}
                >
                  {insight.severity}
                </span>
                <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{insight.title}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{insight.message}</p>
                {insight.action && (
                  <p className="mt-1 text-[11px] font-medium text-navy-600 dark:text-navy-400">{insight.action}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {data.sections.map((section) => (
          <section key={section.id}>
            {section.layout !== "kpi_row" && (
              <h3 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-200">{section.title}</h3>
            )}
            <SectionRenderer section={section} />
          </section>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-navy-600 dark:border-white/10 dark:border-t-navy-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
        {error}
      </div>
    );
  }

  return null;
}
