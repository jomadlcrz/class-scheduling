import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../../components/ui/chart";

type ProgramSlot = { program: string; count: number; fill: string };

type SlotsByProgramChartProps = {
  data: ProgramSlot[];
  config: ChartConfig;
};

export function SlotsByProgramChart({ data, config }: SlotsByProgramChartProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5">
      <div className="p-5 pb-0">
        <h2 className="font-display text-base font-semibold tracking-wide text-navy-700 dark:text-white">
          By Program
        </h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Slots per program, ranked
        </p>
      </div>
      <ChartContainer config={config} className="h-72 px-2 pb-4 pt-4">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          barCategoryGap="25%"
        >
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            tick={{ fontSize: 11, fill: "currentColor" }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="program"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "currentColor" }}
            width={56}
          />
          <ChartTooltip
            cursor={{ fill: "currentColor", fillOpacity: 0.04 }}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="count" radius={4} maxBarSize={28}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
