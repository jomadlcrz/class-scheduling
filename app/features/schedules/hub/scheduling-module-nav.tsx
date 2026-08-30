import { useNavigate } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  CalendarCheckIcon,
  CalendarShuffleIcon,
  ChevronRightIcon,
  SendIcon,
} from "~/components/ui/icons";
import type { StatusCounts } from "~/features/schedules/hub/scheduling-stages";

type SchedulingModuleNavProps = {
  total: number;
  built: number;
  unscheduled: number;
  counts: StatusCounts;
  hasTerm: boolean;
};

export function SchedulingModuleNav({
  total,
  built,
  unscheduled,
  counts,
  hasTerm,
}: SchedulingModuleNavProps) {
  const navigate = useNavigate();
  const toSubmit = counts.draft + counts.rejected;
  const pendingCount =
    counts.pending_dean_review +
    counts.instructor_review +
    counts.pending_final_approval;

  const modules = [
    {
      key: "generate",
      title: "Generate Schedule",
      subtitle: "Module A · Registrar",
      to: "/schedules/new",
      icon: <CalendarCheckIcon />,
      line: !hasTerm
        ? "Select an academic term first."
        : unscheduled > 0
          ? `${unscheduled} section${unscheduled === 1 ? "" : "s"} still need a timetable.`
          : total === 0
            ? "No sections to schedule yet."
            : "Every section has a saved timetable.",
      actionLabel: unscheduled > 0 ? "Generate schedules" : "Open generator",
      badge:
        !hasTerm
          ? undefined
          : unscheduled > 0
            ? `${unscheduled} to build`
            : total > 0
              ? "Complete"
              : undefined,
      badgeTone: unscheduled > 0 ? ("gold" as const) : ("emerald" as const),
    },
    {
      key: "regular-class",
      title: "Master Schedules",
      subtitle: "Module B · Registrar",
      to: "/schedules/regular-class",
      icon: <SendIcon />,
      line:
        built === 0
          ? "Build timetables before review."
          : toSubmit > 0
            ? `${toSubmit} draft${toSubmit === 1 ? "" : "s"} ready for review.`
            : pendingCount > 0
              ? `${pendingCount} waiting on the dean.`
              : counts.approved > 0
                ? `${counts.approved} published this term.`
                : "Saved set timetables, review lifecycle, editing, and printing.",
      actionLabel: toSubmit > 0 ? "Review schedules" : "Section schedules",
      badge:
        toSubmit > 0
          ? `${toSubmit} drafts`
          : counts.approved > 0
            ? `${counts.approved} approved`
            : built > 0
              ? `${built} built`
              : undefined,
      badgeTone:
        toSubmit > 0
          ? ("gold" as const)
          : counts.approved > 0
            ? ("emerald" as const)
            : ("slate" as const),
    },
    {
      key: "irregular-class",
      title: "Irregular Class",
      subtitle: "Module C · Registrar",
      to: "/schedules/irregular-class",
      icon: <CalendarShuffleIcon />,
      line: "Seat irregular students into published regular class schedules.",
      actionLabel: "Open builder",
      badge: undefined,
      badgeTone: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {modules.map((module) => (
        <Card
          key={module.key}
          className="flex flex-col p-5 transition-shadow hover:shadow-md dark:hover:shadow-black/20"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="grid size-10 place-items-center rounded-xl bg-navy-700/5 text-navy-700 dark:bg-white/10 dark:text-mist-100">
              {module.icon}
            </span>
            {module.badge && (
              <Badge tone={module.badgeTone}>{module.badge}</Badge>
            )}
          </div>
          <p className="mt-3 font-body text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {module.subtitle}
          </p>
          <h3 className="mt-1 font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
            {module.title}
          </h3>
          <p className="mt-2 flex-1 font-body text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {module.line}
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => navigate(module.to)}
              className="text-xs"
            >
              {module.actionLabel}
              <ChevronRightIcon />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
