import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Card } from "~/components/ui/card";
import { PrinterIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { CurriculumForm } from "~/features/curriculum/curriculum-form";
import { CurriculumHeader } from "~/features/curriculum/curriculum-header";
import { CurriculumTable } from "~/features/curriculum/curriculum-table";
import { openCurriculumPrint } from "~/features/curriculum/print-curriculum";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import { PageHeader } from "~/layouts/page-header";
import { curriculumService } from "~/services/curriculum.service";
import type { ProgramCurriculum } from "~/types/curriculum";
import type { Program } from "~/types/program";

export function meta() {
  return [
    { title: "Curriculum — GWC Class Scheduling" },
    { name: "description", content: "View and manage academic program curricula." },
  ];
}

export default function CurriculumRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <CurriculumPage />
    </RoleGuard>
  );
}

function CurriculumPage() {
  const { semesterLabel } = useSemesters();
  const { yearLevelLabel } = useYearLevels();
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [curriculum, setCurriculum] = useState<ProgramCurriculum | null | "loading">(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    curriculumService
      .listPrograms()
      .then((list) => {
        setPrograms(list);
        if (list.length > 0) setSelectedCode(list[0].code);
      })
      .catch(() => setPrograms([]));
  }, []);

  useEffect(() => {
    if (!selectedCode) {
      setCurriculum(null);
      return;
    }
    setCurriculum("loading");
    curriculumService
      .getByProgram(selectedCode)
      .then(setCurriculum)
      .catch(() => setCurriculum(null));
  }, [selectedCode]);

  const isLoaded = curriculum !== null && curriculum !== "loading";
  const hasSubjects = isLoaded && curriculum.groups.length > 0;
  const totalSubjects = isLoaded
    ? curriculum.groups.reduce((sum, g) => sum + g.subjects.length, 0)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Curriculum"
        description="Subjects assigned to each program by year level and semester."
        actions={
          selectedCode ? <CurriculumForm programCode={selectedCode} /> : undefined
        }
      />

      <div className="mt-6 flex flex-col gap-5">
        <CurriculumHeader
          programs={programs ?? []}
          selected={selectedCode}
          onChange={setSelectedCode}
          curriculum={curriculum}
        />

        {curriculum === "loading" || programs === null ? (
          <div
            role="status"
            aria-label="Loading curriculum"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : !isLoaded ? (
          <EmptyState title="No program selected">
            Select a program to view its curriculum.
          </EmptyState>
        ) : !hasSubjects ? (
          <EmptyState title="No subjects yet">
            {curriculum.programCode} has no curriculum entries. Add subjects to get started.
          </EmptyState>
        ) : (
          <>
            <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
              <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {totalSubjects} subject{totalSubjects !== 1 ? "s" : ""} in this curriculum
              </p>
              <div className="flex items-end gap-3">
                <div className="relative w-full sm:w-64">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    id="curriculum-search"
                    type="search"
                    placeholder="Code or title…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search"
                    className={`${inputClassName} pl-9 pr-4`}
                  />
                </div>
                <ScheduleViewToggle value={viewMode} onChange={setViewMode} ariaLabel="Curriculum view" />
                <div className="inline-flex shrink-0 overflow-hidden rounded-lg border border-slate-300 dark:border-white/10">
                  <button
                    type="button"
                    title="Print curriculum"
                    aria-label="Print curriculum"
                    onClick={() => openCurriculumPrint(curriculum, semesterLabel, yearLevelLabel)}
                    className="grid h-8 w-9 cursor-pointer place-items-center bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white/5 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
                  >
                    <PrinterIcon size={15} />
                  </button>
                </div>
              </div>
            </Card>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${selectedCode}-${viewMode}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
              >
                <CurriculumTable curriculum={curriculum} search={search} viewMode={viewMode} />
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
