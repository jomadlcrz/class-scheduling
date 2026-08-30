import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Card } from "~/components/ui/card";
import { CalendarClockIcon, FlaskConicalIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { LabAnalysisSkeleton } from "~/components/ui/skeleton";
import { aggregateLabSubjects } from "~/features/schedules/lab-analysis/aggregate-subjects";
import { LabAnalysisStats } from "~/features/schedules/lab-analysis/lab-analysis-stats";
import { LabAnalysisLegend } from "~/features/schedules/lab-analysis/lab-analysis-legend";
import { LabAnalysisVerdict } from "~/features/schedules/lab-analysis/lab-analysis-verdict";
import { LabProgramAccessCards } from "~/features/schedules/lab-analysis/lab-program-access-cards";
import { LabRoomPlates } from "~/features/schedules/lab-analysis/lab-room-plates";
import { LabSubjectTable } from "~/features/schedules/lab-analysis/lab-subject-table";
import { useCachedData } from "~/hooks/use-cached-data";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { labAnalysisService } from "~/services/lab-analysis.service";
import { programService } from "~/services/program.service";

export function meta() {
  return [
    { title: "Laboratory Analysis — GWC Class Scheduling" },
    { name: "description", content: "Laboratory capacity board — every lab window this term and who holds it." },
  ];
}

export default function LabAnalysisRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <LabAnalysisPage />
    </RoleGuard>
  );
}

function LabAnalysisPage() {
  const { schoolYears, defaultSchoolYear, loading: syLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semLoading } = useSemesters();

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState(1);
  const [programFilter, setProgramFilter] = useState("all");

  const { data: programsData } = useCachedData("programs", () => programService.list());
  const programs = programsData ?? [];

  const matchedSy = schoolYears.find((s) => s.schoolYear === schoolYear);
  const matchedSem = semesters.find((s) => s.semesterNumber === semester);
  const termReady = Boolean(matchedSy && matchedSem);

  useEffect(() => {
    if (schoolYear || schoolYears.length === 0) return;
    setSchoolYear(defaultSchoolYear);
  }, [schoolYear, schoolYears, defaultSchoolYear]);

  // Term + program scoped; cached per combination so revisits skip the skeleton.
  const analysisKey = `lab-analysis:${matchedSy?.id ?? "none"}:${matchedSem?.semesterNumber ?? "none"}:${programFilter}`;
  const { data: analysis, error: loadError } = useCachedData(
    analysisKey,
    () =>
      labAnalysisService.analyze({
        syId: matchedSy!.id,
        semesterNumber: matchedSem!.semesterNumber,
        programId: programFilter === "all" ? undefined : Number(programFilter),
      }),
    { enabled: termReady },
  );

  const subjectRows = analysis ? aggregateLabSubjects(analysis.laboratories) : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Laboratory Analysis"

      />

      <Card className="relative mt-5 overflow-hidden border-blue-200 bg-linear-to-br from-blue-50 via-white to-gold-50/60 shadow-sm shadow-navy-900/5 dark:border-blue-400/15 dark:from-blue-400/10 dark:via-surface-raised dark:to-gold-400/5">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-gwc-blue via-blue-500 to-gold-400" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gwc-blue text-mist-100 shadow-lg shadow-gwc-blue/20">
              <FlaskConicalIcon />
            </div>
            <div className="min-w-0">
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-gwc-blue dark:text-blue-300">Capacity intelligence</p>
              <h2 className="mt-1 font-display text-xl tracking-wide text-navy-800 dark:text-mist-100 sm:text-2xl">Know where every lab window goes.</h2>
              <p className="mt-1.5 max-w-2xl font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">Review room capacity, program access, and booked laboratory sessions before approving the next schedule.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
            <CalendarClockIcon />
            <div>
              <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active lens</p>
              <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">{schoolYear || "Select a term"} · {termReady ? semesterLabel(semester) : "—"}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex flex-col gap-4">
        <Card className="relative grid grid-cols-1 gap-4 overflow-hidden border-slate-200 p-4 sm:grid-cols-3 sm:p-5 dark:border-white/10">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-300 to-transparent dark:via-blue-400/40" />
          <FieldChrome id="la-school-year" label="School Year">
            <Select
              items={
                syLoading
                  ? [{ value: "", label: "Loading…" }]
                  : schoolYears.length === 0
                    ? [{ value: "", label: "No school year" }]
                    : schoolYears.map((y) => ({ value: y.schoolYear, label: y.schoolYear }))
              }
              value={schoolYear}
              onValueChange={(v) => setSchoolYear(v as string)}
            >
              <SelectTrigger id="la-school-year">
                <SelectValue placeholder="Select school year" />
              </SelectTrigger>
              <SelectContent>
                {syLoading ? (
                  <SelectItem value="">Loading…</SelectItem>
                ) : schoolYears.length === 0 ? (
                  <SelectItem value="">No school year</SelectItem>
                ) : (
                  schoolYears.map((y) => (
                    <SelectItem key={y.id} value={y.schoolYear}>
                      {y.schoolYear}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldChrome>

          <FieldChrome id="la-semester" label="Semester">
            <Select
              items={
                semLoading
                  ? [{ value: "", label: "Loading…" }]
                  : semesters.length === 0
                    ? [{ value: "", label: "No semester" }]
                    : semesters
                        .filter((s) => s.semesterNumber !== 3)
                        .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))
              }
              value={semLoading ? "" : String(semester)}
              onValueChange={(v) => setSemester(Number(v))}
            >
              <SelectTrigger id="la-semester">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semLoading ? (
                  <SelectItem value="">Loading…</SelectItem>
                ) : semesters.length === 0 ? (
                  <SelectItem value="">No semester</SelectItem>
                ) : (
                  semesters
                    .filter((s) => s.semesterNumber !== 3)
                    .map((s) => (
                      <SelectItem key={s.semesterNumber} value={String(s.semesterNumber)}>
                        {semesterLabel(s.semesterNumber)}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </FieldChrome>

          <FieldChrome id="la-program" label="Program Lens">
            <Select
              items={[
                { value: "all", label: "All programs" },
                ...programs.map((p) => ({ value: String(p.id), label: p.abbrev })),
              ]}
              value={programFilter}
              onValueChange={(v) => setProgramFilter(v as string)}
            >
              <SelectTrigger id="la-program">
                <SelectValue placeholder="All programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.abbrev}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {!termReady ? (
          <EmptyState title="Select a term">Pick a school year and semester to view laboratory capacity.</EmptyState>
        ) : loadError && analysis === null ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : analysis === null ? (
          <LabAnalysisSkeleton />
        ) : analysis.laboratories.length === 0 ? (
          <EmptyState title="No laboratory rooms">No active laboratory rooms are configured yet.</EmptyState>
        ) : (
          <>
            <LabAnalysisVerdict totals={analysis.totals} />
            <LabAnalysisStats totals={analysis.totals} />

            <section>
              <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">Room by Room</h2>
              <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
                Each cell is one {analysis.slotTemplate[0]?.hours ?? "—"}-hour lab window — shading shows the year
                level taking it.
              </p>
              <div className="mt-3">
                <LabAnalysisLegend />
              </div>
              <div className="mt-4">
                <LabRoomPlates laboratories={analysis.laboratories} />
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
                Who May Use These Rooms
              </h2>
              <div className="mt-3">
                {analysis.programAccess.length === 0 ? (
                  <EmptyState title="No restricted access configured">
                    Every laboratory here is general-purpose — reachable by any program housed in its building.
                  </EmptyState>
                ) : (
                  <LabProgramAccessCards programs={analysis.programAccess} />
                )}
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
                What Is Consuming the Labs
              </h2>
              <div className="mt-3">
                {subjectRows.length === 0 ? (
                  <EmptyState title="No sessions booked">
                    No subject has been scheduled into a lab this term yet.
                  </EmptyState>
                ) : (
                  <LabSubjectTable rows={subjectRows} />
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
