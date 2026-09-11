import { useLocation } from "react-router";
import { Breadcrumb } from "~/components/ui/breadcrumb";

const SUB_STEP_LABELS: Record<string, string> = {
  "/schedules/new": "Generate Schedule",
  "/schedules/department-schedules": "Master Schedules",
  "/schedules/adjustment-board": "Adjustment Board",
  "/schedules/pending-schedule": "Irregular",
  "/schedules/lab-analysis": "Lab Analysis",
};

export function SchedulingHubNav() {
  const { pathname } = useLocation();
  const subLabel = SUB_STEP_LABELS[pathname] ?? null;

  const items = [
    { label: "Hub Overview", href: subLabel ? "/schedules" : undefined },
    ...(subLabel ? [{ label: subLabel }] : []),
  ];

  return <Breadcrumb items={items} className="w-fit" />;
}
