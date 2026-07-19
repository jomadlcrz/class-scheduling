import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { ResultState } from "~/components/feedback/result-state";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { WeeklyHourAllocationForm } from "~/features/schedules/weekly-hour-allocation-form";
import { WeeklyHourAllocationList } from "~/features/schedules/weekly-hour-allocation-list";
import { PageHeader } from "~/layouts/page-header";
import { enumService } from "~/services/enum.service";
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
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    enumService
      .getOptions()
      .then((o) => setTypes(o.subjectType))
      .catch(() => setTypes([]));
    weeklyHourService
      .list()
      .then(setAllocations)
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load allocations.");
        setAllocations([]);
      });
  }, []);

  async function handleCreate(input: CreateWeeklyHourAllocationInput) {
    const message = await weeklyHourService.create(input);
    if (message) toast.success(message);
    // The backend upserts per subject type — refetch for the saved state.
    weeklyHourService.list().then(setAllocations).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Weekly Hour Allocations"
        description="Set the maximum weekly hours for each subject type. These limits are enforced when building class schedules."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <Card className="h-fit p-4">
          <h2 className="mb-3 font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
            Set Allocation
          </h2>
          <WeeklyHourAllocationForm types={types} onSubmit={handleCreate} />
        </Card>

        <div>
          <h2 className="mb-3 font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
            Current Allocations
          </h2>
          {loadError ? (
            <ResultState tone="error" title="Unable to load">
              {loadError}
            </ResultState>
          ) : allocations === null ? (
            <div
              role="status"
              aria-label="Loading allocations"
              className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
            >
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
