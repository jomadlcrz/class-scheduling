import { AlertTriangleIcon, CheckIcon, UsersIcon } from "../../components/ui/icons";
import type { Conflict } from "../../services/conflict.service";

type ConflictPanelProps = {
  conflicts: Conflict[];
};

export function ConflictPanel({ conflicts }: ConflictPanelProps) {
  const facultyCount = conflicts.filter((c) => c.type === "faculty").length;
  const roomCount = conflicts.filter((c) => c.type === "room").length;
  const sectionCount = conflicts.filter((c) => c.type === "section").length;
  const total = conflicts.length;

  if (total === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <span className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400">
          <CheckIcon />
        </span>
        <div>
          <p className="font-body text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            No conflicts detected
          </p>
          <p className="mt-0.5 font-body text-sm text-emerald-700 dark:text-emerald-400">
            All schedules are clear with no overlapping time slots.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard
        label="Faculty Conflicts"
        count={facultyCount}
        icon={<UsersIcon />}
        tone={facultyCount > 0 ? "red" : "green"}
      />
      <SummaryCard
        label="Room Conflicts"
        count={roomCount}
        icon={<AlertTriangleIcon />}
        tone={roomCount > 0 ? "red" : "green"}
      />
      <SummaryCard
        label="Section Conflicts"
        count={sectionCount}
        icon={<AlertTriangleIcon />}
        tone={sectionCount > 0 ? "red" : "green"}
      />
    </div>
  );
}

function SummaryCard({
  label,
  count,
  icon,
  tone,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: "red" | "green";
}) {
  const colorMap = {
    red: {
      bg: "bg-red-50 dark:bg-red-500/10",
      border: "border-red-200 dark:border-red-500/20",
      icon: "text-red-500 dark:text-red-400",
      count: "text-red-700 dark:text-red-300",
      label: "text-red-600 dark:text-red-400",
    },
    green: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/20",
      icon: "text-emerald-500 dark:text-emerald-400",
      count: "text-emerald-700 dark:text-emerald-300",
      label: "text-emerald-600 dark:text-emerald-400",
    },
  }[tone];

  return (
    <div className={`flex items-center gap-4 rounded-xl border p-4 ${colorMap.bg} ${colorMap.border}`}>
      <span className={colorMap.icon}>{icon}</span>
      <div>
        <p className={`font-display text-2xl tracking-wide ${colorMap.count}`}>{count}</p>
        <p className={`font-body text-xs font-medium ${colorMap.label}`}>{label}</p>
      </div>
    </div>
  );
}
