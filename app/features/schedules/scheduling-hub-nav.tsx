import { useLocation } from "react-router";
import { Breadcrumb } from "~/components/ui/breadcrumb";

const SUB_STEP_LABELS: Record<string, string> = {
  "/schedules/new": "Generate Schedule",
  "/schedules/regular-class": "Master Schedules",
  "/schedules/department-schedules": "Master Schedules",
  "/schedules/adjustment-board": "Adjustment Board",
  "/schedules/irregular-class": "Irregular Class",
  "/schedules/pending-schedule": "Irregular Class",
  "/schedules/lab-analysis": "Lab Analysis",
};

export function SchedulingHubNav({ className = "mb-4" }: { className?: string } = {}) {
  const { pathname } = useLocation();
  const subLabel = SUB_STEP_LABELS[pathname] ?? null;

  const items = [
    { label: "Scheduling Hub", href: subLabel ? "/schedules" : undefined },
    ...(subLabel ? [{ label: subLabel }] : []),
  ];

  return <Breadcrumb items={items} className={className} />;
}
