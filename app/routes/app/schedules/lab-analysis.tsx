import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { aggregateLabSubjects } from "~/features/schedules/lab-analysis/aggregate-subjects";
import { LabAnalysisKpis } from "~/features/schedules/lab-analysis/lab-analysis-kpis";
import { LabAnalysisLegend } from "~/features/schedules/lab-analysis/lab-analysis-legend";
import { LabAnalysisVerdict } from "~/features/schedules/lab-analysis/lab-analysis-verdict";
import { LabProgramAccessCards } from "~/features/schedules/lab-analysis/lab-program-access-cards";
import { LabRoomPlates } from "~/features/schedules/lab-analysis/lab-room-plates";
import { LabSubjectTable } from "~/features/schedules/lab-analysis/lab-subject-table";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { labAnalysisService } from "~/services/lab-analysis.service";
import { programService } from "~/services/program.service";
import type { LabAnalysis } from "~/types/lab-analysis";
import type { Program } from "~/types/program";

export function meta() {
  return [
    { title: "Laboratory Analysis — GWC Class Scheduling" },
    { name: "description", content: "Laboratory capacity board — every lab window this term and who holds it." },
  ];
}

export default function LabAnalysisRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <LabAnalysisPage />
    </RoleGuard>
  );
}

function LabAnalysisPage() {
  const { schoolYears, defaultSchoolYear, loading: syLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semLoading } = useSemesters();

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState(1);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programFilter, setProgramFilter] = useState("all");

  const [analysis, setAnalysis] = useState<LabAnalysis | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const matchedSy = schoolYears.find((s) => s.schoolYear === schoolYear);
  const matchedSem = semesters.find((s) => s.semesterNumber === semester);

  useEffect(() => {
    if (schoolYear || schoolYears.length === 0) return;
    setSchoolYear(defaultSchoolYear);
  }, [schoolYear, schoolYears, defaultSchoolYear]);

  useEffect(() => {
    programService.list().then(setPrograms).catch(() => setPrograms([]));
  }, []);

  useEffect(() => {
    if (!matchedSy || !matchedSem) {
      setAnalysis(null);
      return;
    }
    let stale = false;
    setAnalysis(null);
    setLoadError(null);
    labAnalysisService
      .analyze({
        syId: matchedSy.id,
        semId: matchedSem.id,
        programId: programFilter === "all" ? undefined : Number(programFilter),
      })
      .then((data) => {
        if (!stale) setAnalysis(data);
      })
      .catch((err) => {
        if (stale) return;
        setLoadError(err instanceof Error ? err.message : "Unable to load laboratory analysis.");
      });
    return () => {
      stale = true;
    };
  }, [matchedSy?.id, matchedSem?.id, programFilter]);

  const termReady = Boolean(matchedSy && matchedSem);
  const subjectRows = analysis ? aggregateLabSubjects(analysis.laboratories) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Laboratory Analysis"
        description="Every computer lab window for the term, and who holds it. A lab class only fits where a whole window is open."
      />

      <div className="mt-4 flex flex-col gap-4">
        <Card className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
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
                <SelectValue />
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
                <SelectValue />
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
                <SelectValue />
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
        ) : loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : analysis === null ? (
          <div
            role="status"
            aria-label="Loading laboratory analysis"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : analysis.laboratories.length === 0 ? (
          <EmptyState title="No laboratory rooms">No active laboratory rooms are configured yet.</EmptyState>
        ) : (
          <>
            <LabAnalysisVerdict totals={analysis.totals} />
            <LabAnalysisKpis totals={analysis.totals} />

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">Room by Room</h2>
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                Each cell is one {analysis.slotTemplate[0]?.hours ?? "—"}-hour lab window. Shading is the year level
                taking it.
              </p>
            </div>
            <LabAnalysisLegend />
            <LabRoomPlates laboratories={analysis.laboratories} />

            <h2 className="mt-2 font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
              Who May Use These Rooms
            </h2>
            {analysis.programAccess.length === 0 ? (
              <EmptyState title="No restricted access configured">
                Every laboratory here is general-purpose — reachable by any program housed in its building.
              </EmptyState>
            ) : (
              <LabProgramAccessCards programs={analysis.programAccess} />
            )}

            <h2 className="mt-2 font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
              What Is Consuming the Labs
            </h2>
            {subjectRows.length === 0 ? (
              <EmptyState title="No sessions booked">No subject has been scheduled into a lab this term yet.</EmptyState>
            ) : (
              <LabSubjectTable rows={subjectRows} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
