import { Card } from "~/components/ui/card";
import { AlertTriangleIcon, CheckIcon, ClockIcon, UserIcon } from "~/components/ui/icons";

type AssignmentLoadSummaryProps = {
  instructors: number;
  underload: number;
  regular: number;
  overload: number;
};

const items = [
  { key: "instructors", label: "Instructors", icon: <UserIcon />, color: "text-navy-700 dark:text-mist-100" },
  { key: "underload", label: "Underload", icon: <ClockIcon size={18} />, color: "text-amber-600 dark:text-amber-400" },
  { key: "regular", label: "Regular", icon: <CheckIcon size={18} />, color: "text-emerald-600 dark:text-emerald-400" },
  { key: "overload", label: "Overload", icon: <AlertTriangleIcon />, color: "text-red-600 dark:text-red-400" },
] as const;

export function AssignmentLoadSummary(props: AssignmentLoadSummaryProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.key} className="flex items-center gap-3 p-4">
          <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-white/10 ${item.color}`}>
            {item.icon}
          </span>
          <div>
            <p className={`font-display text-2xl tabular-nums tracking-wide ${item.color}`}>
              {props[item.key]}
            </p>
            <p className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
