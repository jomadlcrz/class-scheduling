import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../../components/ui/chart";

type SlotsByDayChartProps = {
  data: { day: string; slots: number }[];
  subtitle: string;
};

const config = {
  slots: { label: "Slots", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export function SlotsByDayChart({ data, subtitle }: SlotsByDayChartProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5">
      <div className="p-5 pb-0">
        <h2 className="font-display text-base font-semibold tracking-wide text-navy-700 dark:text-white">
          Slots by Day
        </h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
      </div>
      <ChartContainer config={config} className="h-72 px-1 pt-4 pb-2">
        <AreaChart data={data} margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="fillSlots" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="currentColor"
            strokeOpacity={0.06}
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12, fill: "currentColor" }}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area
            type="natural"
            dataKey="slots"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#fillSlots)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
