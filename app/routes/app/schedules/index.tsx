import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { SchedulingHubSkeleton } from "~/components/ui/skeleton";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { HubActionQueue } from "~/features/schedules/hub/hub-action-queue";
import { HubNextStepCard } from "~/features/schedules/hub/hub-next-step-card";
import { HubStatStrip } from "~/features/schedules/hub/hub-stat-strip";
import { SchedulingModuleNav } from "~/features/schedules/hub/scheduling-module-nav";
import { useSchedulingHubData } from "~/features/schedules/hub/use-scheduling-hub-data";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";

export function meta() {
  return [
    { title: "Scheduling Hub — GWC Class Scheduling" },
    {
      name: "description",
      content: "Registrar control tower: term setup, schedule generation, review, and dean approval at a glance.",
    },
  ];
}

export default function SchedulesHubRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <SchedulingHubPage />
    </RoleGuard>
  );
}

function SchedulingHubPage() {
  const { context: termContext, loading: termLoading, error: termError } = useTermContext();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();

  const [syId, setSyId] = useState<number | null>(null);
  const [semester, setSemester] = useState<number>(1);

  const schoolYears = termContext?.schoolYears ?? [];

  // Seed the picker from the app-wide term selection once it resolves.
  useEffect(() => {
    if (syId != null) return;
    const selection = termContext?.selection;
    if (selection?.syId != null) {
      setSyId(selection.syId);
      if (selection.semesterNumber) setSemester(selection.semesterNumber);
    }
  }, [termContext, syId]);

  const hub = useSchedulingHubData(syId, semester);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Scheduling Hub"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-48">
              <Select
                items={
                  schoolYears.length === 0
                    ? [{ value: "", label: "No school year" }]
                    : schoolYears.map((y) => ({ value: String(y.id), label: y.schoolYear }))
                }
                value={syId != null ? String(syId) : ""}
                onValueChange={(v) => setSyId(v ? Number(v) : null)}
              >
                <SelectTrigger id="hub-school-year" className="h-9">
                  <SelectValue placeholder="Select school year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.length === 0 ? (
                    <SelectItem value="">No school year</SelectItem>
                  ) : (
                    schoolYears.map((y) => (
                      <SelectItem key={y.id} value={String(y.id)}>
                        {y.schoolYear}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select
                items={semesters
                  .filter((s) => s.semesterNumber !== 3)
                  .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))}
                value={String(semester)}
                onValueChange={(v) => setSemester(Number(v))}
              >
                <SelectTrigger id="hub-semester" className="h-9">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters
                    .filter((s) => s.semesterNumber !== 3)
                    .map((s) => (
                      <SelectItem key={s.id} value={String(s.semesterNumber)}>
                        {semesterLabel(s.semesterNumber)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      <div className="mt-6">
        {termError ? (
          <EmptyState title="Unable to load academic term">
            {termError}
          </EmptyState>
        ) : !termLoading && schoolYears.length === 0 ? (
          <EmptyState title="No school years available">
            Create a school year before using the scheduling hub.
          </EmptyState>
        ) : !semestersLoading && semesters.length === 0 ? (
          <EmptyState title="No semesters available">
            Create a semester before using the scheduling hub.
          </EmptyState>
        ) : termLoading || semestersLoading || hub.loading ? (
          <SchedulingHubSkeleton />
        ) : (
          <div className="flex flex-col gap-5">
            <HubStatStrip built={hub.built} total={hub.total} counts={hub.counts} />
            <SchedulingModuleNav
              total={hub.total}
              built={hub.built}
              unscheduled={hub.unscheduled}
              counts={hub.counts}
              hasTerm={hub.hasTerm}
            />
            <HubNextStepCard stage={hub.stage} />
            <HubActionQueue
              releases={hub.releases}
              unscheduledSets={hub.unscheduledSets}
              schoolYear={schoolYears.find((y) => y.id === syId)?.schoolYear ?? ""}
              semester={semester}
            />
          </div>
        )}
      </div>
    </div>
  );
}
