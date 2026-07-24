import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Card } from "~/components/ui/card";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { CurriculumTable } from "~/features/curriculum/curriculum-table";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import { PageHeader } from "~/layouts/page-header";
import { deanService } from "~/services/dean.service";
import type { DepartmentSubjectProgram } from "~/types/faculty-load";
import type { ProgramCurriculum } from "~/types/curriculum";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    deanService
      .listDepartmentSubjects()
      .then((data) => {
        setSubjects(data);
        if (data.length > 0) setSelectedProgram(data[0].programName);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load department subjects.");
        setSubjects([]);
      });
  }, []);

  const currentProgram = subjects?.find((p) => p.programName === selectedProgram) ?? null;

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
            {/* Program tabs */}
            <div className="flex flex-wrap gap-2">
              {subjects.map((p) => (
                <button
                  key={p.programName}
                  type="button"
                  onClick={() => setSelectedProgram(p.programName)}
                  className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                    selectedProgram === p.programName
                      ? "bg-navy-800 text-white dark:bg-white dark:text-navy-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
                  }`}
                >
                  {p.programAbbrev || p.programName}
                </button>
              ))}
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
