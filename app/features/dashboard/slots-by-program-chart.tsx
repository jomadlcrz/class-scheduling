import { Cell, LabelList, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
          Slot distribution across programs
        </p>
      </div>
      <ChartContainer config={config} className="h-72 pb-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="count"
            nameKey="program"
            outerRadius="80%"
            strokeWidth={2}
            stroke="transparent"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="count"
              className="fill-white"
              stroke="none"
              fontSize={13}
              fontWeight={600}
            />
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="program" />}
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}
