import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Card } from "~/components/ui/card";
import { EyeIcon, PlusIcon } from "~/components/ui/icons";
import { Button } from "~/components/ui/button";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
  StatusBadge,
} from "~/features/academic-terms/status-badges";
import { TableActionButton } from "~/features/academic-terms/table-action-button";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { yearLevelStyle } from "~/features/schedules/lab-analysis/year-level-styles";
import { SchedulePreviewModal } from "~/features/schedules/schedule-preview-modal";
import { useScheduleReleases } from "~/hooks/use-schedule-releases";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { departmentLogoSrc, onDepartmentLogoError } from "~/lib/department-logo";
import { departmentService } from "~/services/department.service";
import { programService } from "~/services/program.service";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import { scheduleService, type ScheduleYearLevelOption } from "~/services/schedule.service";
import type { Program } from "~/types/program";
import type { ScheduleRelease, ScheduleReleaseStatus } from "~/types/schedule-release";

export function meta() {
  return [
    { title: "Schedule Overview — GWC Class Scheduling" },
    { name: "description", content: "Every section timetable for the term, grouped by department, program, and year level." },
  ];
}

export default function ScheduleOverviewRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <ScheduleOverviewPage />
    </RoleGuard>
  );
}

const STATUS_ORDER: ScheduleReleaseStatus[] = ["approved", "pending_approval", "rejected", "draft"];

type StatusCounts = Record<ScheduleReleaseStatus, number>;

function emptyCounts(): StatusCounts {
  return { draft: 0, pending_approval: 0, approved: 0, rejected: 0 };
}

function tally(releases: ScheduleRelease[]): StatusCounts {
  const counts = emptyCounts();
  for (const release of releases) counts[release.releaseStatus] += 1;
  return counts;
}

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = n % 100;
  return `${n}${suffixes[(remainder - 20) % 10] ?? suffixes[remainder] ?? suffixes[0]}`;
}

type YearGroup = { yearLevel: number; sets: ScheduleRelease[] };
type ProgramGroup = { abbrev: string; name: string; counts: StatusCounts; years: YearGroup[] };
type DeptGroup = { abbrev: string; counts: StatusCounts; total: number; programs: ProgramGroup[] };

/** Small non-zero status pills, used both in the term summary and each group header. */
function StatusSummary({ counts }: { counts: StatusCounts }) {
  const shown = STATUS_ORDER.filter((status) => counts[status] > 0);
  if (shown.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {shown.map((status) => (
        <StatusBadge key={status} tone={scheduleReleaseStatusTone(status)}>
          {counts[status]} {scheduleReleaseStatusLabel(status)}
        </StatusBadge>
      ))}
    </span>
  );
}

function ScheduleOverviewPage() {
  const navigate = useNavigate();
  const { context: termContext } = useTermContext();
  const { semesters, semesterLabel } = useSemesters();

  const [syId, setSyId] = useState<number | null>(null);
  const [semester, setSemester] = useState<number>(1);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [yearLevels, setYearLevels] = useState<ScheduleYearLevelOption[]>([]);
  const [logoByDept, setLogoByDept] = useState<Map<string, string | null>>(new Map());
  const [previewTarget, setPreviewTarget] = useState<ScheduleRelease | null>(null);

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

  useEffect(() => {
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    departmentService
      .list()
      .then((depts) => setLogoByDept(new Map(depts.map((d) => [d.abbrev, d.logoUrl]))))
      .catch(() => setLogoByDept(new Map()));
    scheduleService
      .getCreationContext()
      .then(({ yearLevels: options }) => setYearLevels(options))
      .catch(() => setYearLevels([]));
  }, []);

  const { releases, loading } = useScheduleReleases(syId, semester);

  // Key by programId — the release carries the real FK; abbrevs aren't guaranteed
  // unique across departments.
  const programById = useMemo(() => {
    const byId = new Map<number, Program>();
    for (const program of programs) byId.set(program.id, program);
    return byId;
  }, [programs]);

  const yearLabel = useMemo(() => {
    const labels = new Map<number, string>();
    for (const option of yearLevels) labels.set(option.id, option.name);
    return (n: number) => labels.get(n) ?? `${ordinal(n)} Year`;
  }, [yearLevels]);

  // Group releases into Department → Program → Year Level.
  const departments = useMemo<DeptGroup[]>(() => {
    const deptMap = new Map<string, Map<string, Map<number, ScheduleRelease[]>>>();
    const programNames = new Map<string, string>();

    for (const release of releases) {
      const program = programById.get(release.programId);
      const abbrev = release.programAbbrev ?? program?.abbrev ?? "—";
      const deptAbbrev = program?.departmentAbbrev || "Unassigned";
      programNames.set(abbrev, program?.name ?? "");
      const year = release.yearLevel ?? 0;

      const programsOfDept = deptMap.get(deptAbbrev) ?? new Map();
      const yearsOfProgram = programsOfDept.get(abbrev) ?? new Map();
      const setsOfYear = yearsOfProgram.get(year) ?? [];
      setsOfYear.push(release);
      yearsOfProgram.set(year, setsOfYear);
      programsOfDept.set(abbrev, yearsOfProgram);
      deptMap.set(deptAbbrev, programsOfDept);
    }

    return [...deptMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([deptAbbrev, programsOfDept]) => {
        const programGroups: ProgramGroup[] = [...programsOfDept.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([abbrev, yearsOfProgram]) => {
            const years: YearGroup[] = [...yearsOfProgram.entries()]
              .sort(([a], [b]) => a - b)
              .map(([yearLevel, sets]) => ({
                yearLevel,
                sets: [...sets].sort((a, b) => (a.setCode ?? "").localeCompare(b.setCode ?? "")),
              }));
            const flatSets = years.flatMap((y) => y.sets);
            return { abbrev, name: programNames.get(abbrev) ?? "", counts: tally(flatSets), years };
          });
        const deptSets = programGroups.flatMap((p) => p.years.flatMap((y) => y.sets));
        return {
          abbrev: deptAbbrev,
          counts: tally(deptSets),
          total: deptSets.length,
          programs: programGroups,
        };
      });
  }, [releases, programById]);

  const termCounts = useMemo(() => tally(releases), [releases]);
  const contextReady = syId != null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Schedule Overview"
        description="Every section timetable for the term, grouped by department, program, and year level — with its approval status at a glance."
        actions={
          <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
            <PlusIcon />
            Create Schedule
          </Button>
        }
      />

      <Card className="mt-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <FieldChrome id="so-school-year" label="School Year">
          <Select
            items={
              schoolYears.length === 0
                ? [{ value: "", label: "No school year" }]
                : schoolYears.map((y) => ({ value: String(y.id), label: y.schoolYear }))
            }
            value={syId != null ? String(syId) : ""}
            onValueChange={(v) => setSyId(v ? Number(v) : null)}
          >
            <SelectTrigger id="so-school-year">
              <SelectValue />
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
        <FieldChrome id="so-semester" label="Semester">
          <Select
            items={semesters
              .filter((s) => s.semesterNumber !== 3)
              .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))}
            value={String(semester)}
            onValueChange={(v) => setSemester(Number(v))}
          >
            <SelectTrigger id="so-semester">
              <SelectValue />
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

      {contextReady && releases.length > 0 && (
        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="font-body text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-navy-700 dark:text-mist-100">{releases.length}</span> section
            {releases.length === 1 ? "" : "s"} across{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">{departments.length}</span> department
            {departments.length === 1 ? "" : "s"}
          </span>
          <StatusSummary counts={termCounts} />
        </Card>
      )}

      <div className="mt-4">
        {!contextReady || loading ? (
          <div role="status" aria-label="Loading schedules" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : releases.length === 0 ? (
          <EmptyState title="No schedules for this term">
            No section timetables have been created for this school year and semester yet. Create one to get
            started.
          </EmptyState>
        ) : (
          <Accordion>
            {departments.map((dept, index) => (
              <AccordionItem
                key={dept.abbrev}
                defaultOpen={index === 0}
                adornment={
                  <span className="hidden sm:inline-flex">
                    <StatusSummary counts={dept.counts} />
                  </span>
                }
                title={
                  <span className="flex flex-col gap-2">
                    <span className="flex items-center gap-2.5">
                      <img
                        src={departmentLogoSrc(logoByDept.get(dept.abbrev) ?? null)}
                        alt=""
                        aria-hidden="true"
                        onError={onDepartmentLogoError}
                        className="size-8 shrink-0 object-contain"
                      />
                      <span className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
                        {dept.abbrev}
                      </span>
                      <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                        {dept.total} set{dept.total === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="sm:hidden">
                      <StatusSummary counts={dept.counts} />
                    </span>
                  </span>
                }
              >
                <div className="flex flex-col gap-6 px-4 py-4 sm:px-5">
                  {dept.programs.map((program) => (
                    <section key={program.abbrev} aria-label={program.abbrev}>
                      <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
                        <h3 className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                          {program.abbrev}
                        </h3>
                        {program.name && (
                          <span className="min-w-0 font-body text-xs text-slate-500 dark:text-slate-400">
                            {program.name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-4">
                        {program.years.map((year) => {
                          const yStyle = yearLevelStyle(year.yearLevel);
                          return (
                          <div key={year.yearLevel}>
                            <div className="mb-2.5 flex items-center gap-3">
                              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" aria-hidden="true" />
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-bold uppercase tracking-wider ${yStyle.chip}`}
                              >
                                <span className={`size-1.5 rounded-full ${yStyle.dot}`} aria-hidden="true" />
                                {yearLabel(year.yearLevel)}
                              </span>
                              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" aria-hidden="true" />
                            </div>
                            <Table>
                              <TableHead>
                                <TableHeader>Set</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader className="text-center">Sessions</TableHeader>
                                <TableHeader>
                                  <span className="sr-only">Actions</span>
                                </TableHeader>
                              </TableHead>
                              <TableBody>
                                {year.sets.map((release) => (
                                  <TableRow key={release.id}>
                                    <TableCell>
                                      <span className="font-medium text-navy-700 dark:text-mist-100">
                                        {release.setCode ?? "—"}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <StatusBadge tone={scheduleReleaseStatusTone(release.releaseStatus)}>
                                        {scheduleReleaseStatusLabel(release.releaseStatus)}
                                      </StatusBadge>
                                    </TableCell>
                                    <TableCell className="text-center">{release.sessionCount}</TableCell>
                                    <TableCell>
                                      <div className="flex justify-end">
                                        <TableActionButton
                                          onClick={() => setPreviewTarget(release)}
                                          disabled={release.sessionCount === 0}
                                          title={
                                            release.sessionCount === 0 ? "No sessions saved yet" : undefined
                                          }
                                        >
                                          <EyeIcon />
                                          View
                                        </TableActionButton>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <SchedulePreviewModal
        open={previewTarget !== null}
        releaseId={previewTarget?.id ?? null}
        fetchPreview={scheduleReleaseService.getReleasePreview}
        onClose={() => setPreviewTarget(null)}
      />
    </div>
  );
}
