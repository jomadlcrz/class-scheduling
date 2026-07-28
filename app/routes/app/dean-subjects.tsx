import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Card } from "~/components/ui/card";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { GraduationCapIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { CurriculumTable } from "~/features/curriculum/curriculum-table";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import { PageHeader } from "~/layouts/page-header";
import { deanService } from "~/services/dean.service";
import { programService } from "~/services/program.service";
import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
import type { DepartmentSubjectProgram } from "~/types/faculty-load";
import type { ProgramCurriculum } from "~/types/curriculum";
import type { Program } from "~/types/program";

export function meta() {
  return [
    { title: "Department Subjects — GWC Class Scheduling" },
    { name: "description", content: "View curriculum subjects for your department." },
  ];
}

export default function DeanSubjectsRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanSubjectsPage />
    </RoleGuard>
  );
}

function DeanSubjectsPage() {
  const { semesterLabel } = useSemesters();
  const { yearLevelLabel } = useYearLevels();
  const [subjects, setSubjects] = useState<DepartmentSubjectProgram[] | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    Promise.all([
      deanService.listDepartmentSubjects(),
      programService.list().catch(() => []),
    ])
      .then(([data, progs]) => {
        setSubjects(data);
        setPrograms(progs);
        if (data.length > 0) setSelectedProgram(data[0].programName);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load department subjects.");
        setSubjects([]);
      });
  }, []);

  const currentProgram = subjects?.find((p) => p.programName === selectedProgram) ?? null;

  const departmentCode = useMemo(() => {
    if (!currentProgram) return null;
    const program = programs.find((p) => p.name === currentProgram.programName);
    return program?.departmentAbbrev || null;
  }, [currentProgram, programs]);

  const curriculum: ProgramCurriculum | null = useMemo(() => {
    if (!currentProgram) return null;
    return {
      programCode: currentProgram.programAbbrev || currentProgram.programName,
      programName: currentProgram.programName,
      departmentCode: "",
      totalUnits: currentProgram.programTotalUnits,
      groups: currentProgram.curriculumDetails.flatMap((year) =>
        year.semesterDetails.map((sem) => ({
          yearLevel: year.yearLevel,
          semester: sem.semester,
          totalUnits: sem.semesterTotalUnits,
          subjects: sem.subjects.map((s) => ({
            id: s.subjectId,
            program: currentProgram.programAbbrev || currentProgram.programName,
            yearLevel: year.yearLevel,
            semester: sem.semester,
            code: s.subjectCode,
            title: s.descriptiveTitle,
            units: s.units,
            lecHours: 0,
            labHours: 0,
            subjectType: "",
            prerequisites: s.prerequisites,
          })),
        })),
      ),
    };
  }, [currentProgram]);

  const totalSubjects = currentProgram
    ? currentProgram.curriculumDetails.reduce(
        (sum, y) => sum + y.semesterDetails.reduce((s, sem) => s + sem.subjects.length, 0),
        0,
      )
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Department Subjects"
        description="Curriculum subjects for your department, organized by program."
      />

      <div className="mt-6 flex flex-col gap-5">
        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : subjects === null ? (
          <div
            role="status"
            aria-label="Loading department subjects"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState title="No subjects found">
            Your department has no curriculum subjects yet.
          </EmptyState>
        ) : (
          <>
            {/* Program header card — matches curriculum page layout */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-raised/80">
              <div className="flex flex-col gap-5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  {departmentCode ? (
                    <img
                      src={departmentLogoUrl(departmentCode)}
                      alt={`${departmentCode} logo`}
                      onError={onDepartmentLogoError}
                      className="size-14 shrink-0 rounded-lg object-contain"
                    />
                  ) : (
                    <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                      <GraduationCapIcon />
                    </span>
                  )}
                  <div className="min-w-0 max-w-xs">
                    <FilterDropdown
                      id="dean-subject-program"
                      label="Program"
                      allLabel="Select a program…"
                      allValue=""
                      options={subjects.map((p) => ({ value: p.programName, label: `${p.programAbbrev || p.programName} — ${p.programName}` }))}
                      value={selectedProgram}
                      onChange={setSelectedProgram}
                    />
                  </div>
                </div>

                <div className="relative min-h-16 shrink-0 self-stretch sm:self-auto sm:pl-6 sm:text-right">
                  {currentProgram && (
                    <>
                      <div
                        aria-hidden="true"
                        className="blueprint-grid pointer-events-none absolute inset-0 -z-10 text-navy-900/5 dark:text-mist-100/8"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-6 right-0 -z-10 size-32 opacity-20 dark:opacity-[0.15]"
                        style={{ background: "radial-gradient(circle, var(--color-gold-400) 0%, transparent 70%)" }}
                      />
                    </>
                  )}
                  <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Total Units
                  </p>
                  {!currentProgram ? (
                    <p className="mt-0.5 font-display text-2xl tracking-wide text-slate-300 dark:text-slate-600">—</p>
                  ) : (
                    <>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                          key={currentProgram.programTotalUnits}
                          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="mt-0.5 font-display text-4xl tabular-nums tracking-wide text-navy-700 dark:text-mist-100"
                        >
                          {currentProgram.programTotalUnits}
                        </motion.p>
                      </AnimatePresence>
                      <p className="font-body text-xs text-slate-400 dark:text-slate-500">
                        across {currentProgram.curriculumDetails.reduce((sum, y) => sum + y.semesterDetails.length, 0)} term{currentProgram.curriculumDetails.reduce((sum, y) => sum + y.semesterDetails.length, 0) !== 1 ? "s" : ""}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {currentProgram && (
              <>
                <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
                  <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {totalSubjects} subject{totalSubjects !== 1 ? "s" : ""} in {currentProgram.programAbbrev || currentProgram.programName}
                    {" — "}
                    {currentProgram.programTotalUnits} total units
                  </p>
                  <div className="flex items-end gap-3">
                    <div className="relative w-full sm:w-64">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <SearchIcon />
                      </span>
                      <input
                        id="dean-subject-search"
                        type="search"
                        placeholder="Code or title…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search subjects"
                        className={`${inputClassName} pl-9 pr-4`}
                      />
                    </div>
                    <ScheduleViewToggle value={viewMode} onChange={setViewMode} ariaLabel="Subjects view" />
                  </div>
                </Card>

                {curriculum && (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${selectedProgram}-${viewMode}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                    >
                      <CurriculumTable curriculum={curriculum} search={search} viewMode={viewMode} />
                    </motion.div>
                  </AnimatePresence>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
