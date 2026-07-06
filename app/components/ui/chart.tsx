import * as React from "react";
import { Legend, ResponsiveContainer, Tooltip } from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

export type ChartConfig = Record<
  string,
  { label: string; color?: string; icon?: React.ComponentType }
>;

type ChartContextValue = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextValue>({ config: {} });

function useChart() {
  return React.useContext(ChartContext);
}

// ── ChartContainer ───────────────────────────────────────────────────────────

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
  children: React.ReactElement;
};

function ChartContainer({ config, children, className, ...props }: ChartContainerProps) {
  // Build CSS variables from config so recharts colors can reference them.
  const style = React.useMemo(() => {
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      if (value.color) vars[`--color-${key}`] = value.color;
    }
    return vars;
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        style={style as React.CSSProperties}
        className={`w-full ${className ?? ""}`}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

// ── ChartTooltipContent ──────────────────────────────────────────────────────

type TooltipPayload = {
  name: string;
  value: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  labelKey?: string;
  hideLabel?: boolean;
  indicator?: "line" | "dot" | "dashed";
};

function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  indicator = "dot",
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-xl dark:border-white/10 dark:bg-navy-800">
      {!hideLabel && label && (
        <p className="font-medium text-slate-700 dark:text-white">{label}</p>
      )}
      <div className="grid gap-1">
        {payload.map((item) => {
          const key = item.name;
          const configEntry = config[key];
          const color = item.color ?? configEntry?.color ?? "currentColor";

          return (
            <div key={key} className="flex w-full items-center gap-2">
              {indicator === "dot" && (
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: color }}
                />
              )}
              {indicator === "line" && (
                <span
                  className="h-px w-3 shrink-0"
                  style={{ background: color }}
                />
              )}
              <span className="flex-1 text-slate-500 dark:text-slate-400">
                {configEntry?.label ?? key}
              </span>
              <span className="font-body font-medium tabular-nums text-slate-700 dark:text-white">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ChartLegendContent ───────────────────────────────────────────────────────

type ChartLegendContentProps = {
  payload?: Array<{ value: string; color?: string; payload?: Record<string, unknown> }>;
  nameKey?: string;
};

function ChartLegendContent({ payload, nameKey }: ChartLegendContentProps) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
      {payload.map((item) => {
        const key = nameKey
          ? String(item.payload?.[nameKey] ?? item.value)
          : item.value;
        const configEntry = config[key];
        const color = item.color ?? configEntry?.color ?? "currentColor";
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {configEntry?.label ?? key}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Re-export recharts Tooltip / Legend with our content as default.
const ChartTooltip = Tooltip;
const ChartLegend = Legend;
