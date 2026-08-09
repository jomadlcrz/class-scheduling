import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarShuffleIcon,
  ChevronRightIcon,
  ClockIcon,
  FlaskConicalIcon,
  ListIcon,
} from "~/components/ui/icons";

type HubModule = { icon: ReactNode; label: string; desc: string; to: string };

const MODULES: HubModule[] = [
  { icon: <CalendarCheckIcon />, label: "Section Schedules", desc: "Generate and edit regular class timetables.", to: "/schedules/regular-class" },
  { icon: <CalendarShuffleIcon />, label: "Irregular Class", desc: "Assign schedules for irregular students.", to: "/schedules/irregular-class" },
  { icon: <ListIcon />, label: "Schedule Overview", desc: "Every section's status at a glance.", to: "/schedules/overview" },
  { icon: <CalendarClockIcon />, label: "Weekly Hour Allocations", desc: "Set weekly teaching hours per subject.", to: "/schedules/weekly-hour-allocations" },
  { icon: <ClockIcon />, label: "Subject Hour Overrides", desc: "Adjust hours for specific subjects.", to: "/schedules/subject-hour-overrides" },
  { icon: <FlaskConicalIcon />, label: "Laboratory Analysis", desc: "Check lab and room capacity.", to: "/schedules/lab-analysis" },
];

/** Launcher cards for the scheduling sub-pages (all existing routes). */
export function HubModuleGrid({ onOpen }: { onOpen: (to: string) => void }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
        Jump to
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((mod) => (
          <button
            key={mod.to}
            type="button"
            onClick={() => onOpen(mod.to)}
            className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gwc-blue/50"
          >
            <Card className="flex h-full items-start gap-3 p-4 transition-colors hover:border-gwc-blue/40">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy-700 dark:bg-white/10 dark:text-mist-100">
                {mod.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                  {mod.label}
                  <ChevronRightIcon />
                </span>
                <span className="mt-0.5 block font-body text-xs text-slate-500 dark:text-slate-400">
                  {mod.desc}
                </span>
              </span>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
