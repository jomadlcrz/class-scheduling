import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
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

  useEffect(() => {
    Promise.all([
      weeklyHourService.getSubjectTypeOptions(),
      weeklyHourService.list(),
    ]).then(([t, a]) => {
      setTypes(t);
      setAllocations(a);
    });
  }, []);

  async function handleCreate(input: CreateWeeklyHourAllocationInput) {
    const created = await weeklyHourService.create(input);
    setAllocations((current) => {
      const existing = (current ?? []).filter((a) => a.subjectType !== created.subjectType);
      return [...existing, created].sort((a, b) => a.subjectTypeLabel.localeCompare(b.subjectTypeLabel));
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Weekly Hour Allocations"
        description="Set the maximum weekly hours for each subject type. These limits are enforced when building class schedules."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card className="p-4 dark:bg-slate-900/60">
          <h3 className="mb-3 flex items-center gap-2 font-body text-sm font-semibold text-navy-700 dark:text-white">
            Set Allocation
          </h3>
          <WeeklyHourAllocationForm types={types} onSubmit={handleCreate} />
        </Card>

        <div>
          <h3 className="mb-3 flex items-center gap-2 font-body text-sm font-semibold text-navy-700 dark:text-white">
            Current Allocations
          </h3>
          {allocations === null ? (
            <div className="grid place-items-center py-12 text-navy-700 dark:text-slate-200">
              <Spinner />
            </div>
          ) : (
            <WeeklyHourAllocationList allocations={allocations} />
          )}
        </div>
      </div>
    </div>
  );
}
