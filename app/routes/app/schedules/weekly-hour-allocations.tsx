import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { ResultState } from "~/components/feedback/result-state";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { WeeklyHourAllocationForm } from "~/features/schedules/weekly-hour-allocation-form";
import { WeeklyHourAllocationList } from "~/features/schedules/weekly-hour-allocation-list";
import { PageHeader } from "~/layouts/page-header";
import { weeklyHourService } from "~/services/weekly-hour-allocation.service";
import type { CreateWeeklyHourAllocationInput, WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

export function meta() {
  return [
    { title: "Weekly Hour Allocations — GWC Class Scheduling" },
    { name: "description", content: "Set the maximum weekly hours for each subject type." },
  ];
}

export default function WeeklyHoursRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <WeeklyHoursPage />
    </RoleGuard>
  );
}

function WeeklyHoursPage() {
  const [types, setTypes] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<WeeklyHourAllocation[] | null>(null);

  // useEffect(() => {
  //   Promise.all([
  //     weeklyHourService.getSubjectTypeOptions(),
  //     weeklyHourService.list(),
  //   ]).then(([t, a]) => {
  //     setTypes(t);
  //     setAllocations(a);
  //   });
  // }, []);

  // async function handleCreate(input: CreateWeeklyHourAllocationInput) {
  //   const created = await weeklyHourService.create(input);
  //   setAllocations((current) => {
  //     const existing = (current ?? []).filter((a) => a.subjectType !== created.subjectType);
  //     return [...existing, created].sort((a, b) => a.subjectTypeLabel.localeCompare(b.subjectTypeLabel));
  //   });
  // }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Weekly Hour Allocations"
        description="Set the maximum weekly hours for each subject type. These limits are enforced when building class schedules."
      />

      <ResultState tone="error" title="Not available">
        This feature is not connected to the backend yet.
      </ResultState>
    </div>
  );
}
