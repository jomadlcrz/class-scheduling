import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { SchedulingHubSkeleton } from "~/components/ui/skeleton";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { HubActionQueue } from "~/features/schedules/hub/hub-action-queue";
import { HubNextStepCard } from "~/features/schedules/hub/hub-next-step-card";
import { HubStatStrip } from "~/features/schedules/hub/hub-stat-strip";
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
  const { context: termContext, loading: termLoading } = useTermContext();
  const { semesters, semesterLabel } = useSemesters();

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
      <PageHeader title="Scheduling Hub" />

      <Card className="mt-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <FieldChrome id="hub-school-year" label="School Year">
          <Select
            items={
              schoolYears.length === 0
                ? [{ value: "", label: "No school year" }]
                : schoolYears.map((y) => ({ value: String(y.id), label: y.schoolYear }))
            }
            value={syId != null ? String(syId) : ""}
            onValueChange={(v) => setSyId(v ? Number(v) : null)}
          >
            <SelectTrigger id="hub-school-year">
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
        </FieldChrome>
        <FieldChrome id="hub-semester" label="Semester">
          <Select
            items={semesters
              .filter((s) => s.semesterNumber !== 3)
              .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))}
            value={String(semester)}
            onValueChange={(v) => setSemester(Number(v))}
          >
            <SelectTrigger id="hub-semester">
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
        </FieldChrome>
      </Card>

      <div className="mt-6">
        {termLoading || hub.loading ? (
          <SchedulingHubSkeleton />
        ) : (
          <div className="flex flex-col gap-5">
            <HubStatStrip built={hub.built} total={hub.total} counts={hub.counts} />
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
