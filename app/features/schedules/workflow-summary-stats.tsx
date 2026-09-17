import { Card } from "~/components/ui/card";

export type WorkflowSummaryTone = "emerald" | "amber" | "gold" | "sky" | "blue" | "violet" | "rose" | "slate";

const TONE_STYLES: Record<WorkflowSummaryTone, { accentClass: string; valueClass: string }> = {
  emerald: { accentClass: "bg-emerald-500", valueClass: "text-emerald-700 dark:text-emerald-300" },
  amber: { accentClass: "bg-amber-500", valueClass: "text-amber-700 dark:text-amber-300" },
  gold: { accentClass: "bg-gold-500", valueClass: "text-gold-700 dark:text-gold-300" },
  sky: { accentClass: "bg-sky-500", valueClass: "text-sky-700 dark:text-sky-300" },
  blue: { accentClass: "bg-blue-500", valueClass: "text-blue-700 dark:text-blue-300" },
  violet: { accentClass: "bg-violet-500", valueClass: "text-violet-700 dark:text-violet-300" },
  rose: { accentClass: "bg-rose-500", valueClass: "text-rose-700 dark:text-rose-300" },
  slate: { accentClass: "bg-slate-400", valueClass: "text-navy-800 dark:text-mist-100" },
};

export type WorkflowSummaryStat = {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
  tone?: WorkflowSummaryTone;
  muted?: boolean;
  onClick?: () => void;
  active?: boolean;
};

export function WorkflowSummaryStats({ stats }: { stats: WorkflowSummaryStat[] }) {
  const desktopColumns =
    stats.length <= 4
      ? "lg:grid-cols-4"
      : stats.length === 5
        ? "lg:grid-cols-5"
        : stats.length === 6
          ? "lg:grid-cols-6"
          : "lg:grid-cols-4 xl:grid-cols-7";
  const desktopDividers = stats.length > 6 ? "xl:divide-y-0" : "lg:divide-y-0";

  return (
    <Card className="overflow-hidden shadow-xs dark:border-white/10 dark:bg-surface-raised">
      <div
        className={`grid grid-cols-2 divide-x divide-y divide-slate-200/80 sm:grid-cols-3 ${desktopColumns} ${desktopDividers} dark:divide-white/10`}
      >
        {stats.map((stat) => {
          const tone = TONE_STYLES[stat.tone ?? "slate"];
          const Tag = stat.onClick ? "button" : "div";
          return (
            <Tag
              key={stat.key}
              type={stat.onClick ? "button" : undefined}
              onClick={stat.onClick}
              aria-pressed={stat.onClick ? stat.active === true : undefined}
              className={`flex min-h-[4.5rem] flex-col items-center justify-center px-3.5 py-2.5 text-center ${
                stat.onClick
                  ? `cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-inset dark:hover:bg-white/5 ${
                      stat.active ? "bg-slate-50 dark:bg-white/5" : ""
                    }`
                  : ""
              }`}
            >
              <span
                className={`mb-2 h-1 w-9 rounded-full ${
                  stat.muted ? "bg-slate-300 dark:bg-white/15" : tone.accentClass
                }`}
                aria-hidden="true"
              />
              <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {stat.label}
              </p>
              <p
                className={`mt-1 font-display text-2xl tracking-wide ${
                  stat.muted ? "text-slate-400 dark:text-slate-500" : tone.valueClass
                }`}
              >
                {stat.value}
              </p>
              {stat.hint ? (
                <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">{stat.hint}</p>
              ) : null}
            </Tag>
          );
        })}
      </div>
    </Card>
  );
}
