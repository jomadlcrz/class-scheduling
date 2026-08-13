import { StatCard } from "~/components/ui/stat-card";

type AssignmentLoadSummaryProps = {
  instructors: number;
  underload: number;
  regular: number;
  overload: number;
};

const items = [
  { key: "instructors", label: "Instructors", color: "text-navy-700 dark:text-mist-100" },
  { key: "underload", label: "Underload", color: "text-amber-600 dark:text-amber-400" },
  { key: "regular", label: "Regular", color: "text-emerald-600 dark:text-emerald-400" },
  { key: "overload", label: "Overload", color: "text-red-600 dark:text-red-400" },
] as const;

export function AssignmentLoadSummary(props: AssignmentLoadSummaryProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <StatCard
          key={item.key}
          label={item.label}
          value={props[item.key]}
          valueClassName={item.color}
        />
      ))}
    </div>
  );
}
