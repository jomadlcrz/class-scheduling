import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuth } from "~/auth/auth-provider";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { PlusIcon, PrinterIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { CurriculumHeader } from "~/features/curriculum/curriculum-header";
import { CurriculumTable } from "~/features/curriculum/curriculum-table";
import { openCurriculumPrint } from "~/features/curriculum/print-curriculum";
import { ProgramArchiveDialog } from "~/features/programs/program-archive-dialog";
import { ProgramForm } from "~/features/programs/program-form";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { SubjectArchiveDialog } from "~/features/subjects/subject-archive-dialog";
import { SubjectForm } from "~/features/subjects/subject-form";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import { PageHeader } from "~/layouts/page-header";
import { curriculumService } from "~/services/curriculum.service";
import { departmentService } from "~/services/department.service";
import { enumService } from "~/services/enum.service";
import { programService } from "~/services/program.service";
import { subjectService } from "~/services/subject.service";
import type { ProgramCurriculum } from "~/types/curriculum";
import type { Department } from "~/types/department";
import type { CreateProgramInput, Program } from "~/types/program";
import type { Subject, UpdateSubjectInput } from "~/types/subject";

export function meta() {
  return [
    { title: "Program Curricula — GWC Class Scheduling" },
    {
      name: "description",
      content: "Programs and the subjects that make up each one, organized by year and semester.",
    },
  ];
}

export default function ProgramCurriculaRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <ProgramCurriculaPage />
    </RoleGuard>
  );
}

function ProgramCurriculaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const canManagePrograms = user?.role === "admin" || user?.role === "registrar";
  const { semesterLabel } = useSemesters();
  const { yearLevelLabel } = useYearLevels();
  const reduceMotion = useReducedMotion();

  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<string[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [curriculum, setCurriculum] = useState<ProgramCurriculum | null | "loading">(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  const [editProgramTarget, setEditProgramTarget] = useState<Program | null>(null);
  const [archiveProgramTarget, setArchiveProgramTarget] = useState<Program | null>(null);
  const [editSubjectTarget, setEditSubjectTarget] = useState<Subject | null>(null);
  const [archiveSubjectTarget, setArchiveSubjectTarget] = useState<Subject | null>(null);

  useEffect(() => {
    programService.list().then((list) => {
      setPrograms(list);
      const requested = searchParams.get("program");
      const initial =
        requested && list.some((p) => p.abbrev === requested) ? requested : (list[0]?.abbrev ?? "");
      setSelectedCode(initial);
    }).catch(() => setPrograms([]));
    departmentService.listAcademic().then(setDepartments).catch(() => setDepartments([]));
    subjectService.list().then(setAllSubjects).catch(() => setAllSubjects([]));
    enumService
      .getOptions()
      .then((options) => setSubjectTypes(options.subjectType))
      .catch(() => {});
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

  async function refreshPrograms() {
    setPrograms(await programService.list());
  }

  async function refreshCurriculum() {
    if (!selectedCode) return;
    setCurriculum(await curriculumService.getByProgram(selectedCode));
  }

  async function refreshSubjects() {
    setAllSubjects(await subjectService.list());
  }

  async function handleEditProgram(input: CreateProgramInput) {
    if (!editProgramTarget) return;
    const message = await programService.update(editProgramTarget.id, {
      abbrev: input.abbrev,
      name: input.name,
      type: input.type,
      lengthYears: input.lengthYears,
      departmentName: input.departmentName,
    });
    if (message) toast.success(message);
    await refreshPrograms();
    if (input.abbrev !== editProgramTarget.abbrev) setSelectedCode(input.abbrev);
    else await refreshCurriculum();
    setEditProgramTarget(null);
  }

  async function handleArchiveProgram(target: Program) {
    const message = await programService.remove(target.id, target.abbrev);
    if (message) toast.success(message);
    const remaining = await programService.list();
    setPrograms(remaining);
    setSelectedCode(target.abbrev === selectedCode ? (remaining[0]?.abbrev ?? "") : selectedCode);
  }

  async function handleEditSubject(input: UpdateSubjectInput) {
    if (!editSubjectTarget) return;
    const message = await subjectService.update(editSubjectTarget.id, input);
    if (message) toast.success(message);
    await Promise.all([refreshCurriculum(), refreshSubjects()]);
    setEditSubjectTarget(null);
  }

  async function handleArchiveSubject(target: Subject) {
    const message = await subjectService.remove(target.id, target.code);
    if (message) toast.success(message);
    await Promise.all([refreshCurriculum(), refreshSubjects()]);
    setArchiveSubjectTarget(null);
  }

  const isLoaded = curriculum !== null && curriculum !== "loading";
  const hasSubjects = isLoaded && curriculum.groups.length > 0;
  const totalSubjects = isLoaded
    ? curriculum.groups.reduce((sum, g) => sum + g.subjects.length, 0)
    : 0;
  const selectedProgram = (programs ?? []).find((p) => p.abbrev === selectedCode) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Program Curricula"
        description="Programs and the subjects that make up each one, organized by year and semester."
        actions={
          canManagePrograms && (
            <Button type="button" block={false} onClick={() => navigate("/program-curricula/new")}>
              <PlusIcon />
              New Curricula
            </Button>
          )
        }
      />

      <div className="mt-6 flex flex-col gap-5">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-raised/80">
          <CurriculumHeader
            programs={programs ?? []}
            selected={selectedCode}
            onChange={setSelectedCode}
            curriculum={curriculum}
            onEditProgram={canManagePrograms && selectedProgram ? () => setEditProgramTarget(selectedProgram) : undefined}
            onArchiveProgram={canManagePrograms && selectedProgram ? () => setArchiveProgramTarget(selectedProgram) : undefined}
          />

          {hasSubjects && (
            <div className="flex flex-col gap-3 border-t border-slate-200 p-4 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
              <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {totalSubjects} subject{totalSubjects !== 1 ? "s" : ""} in this curriculum
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
                <div className="flex items-end justify-end gap-3">
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
              </div>
            </div>
          )}
        </div>

        {curriculum === "loading" || programs === null ? (
          <div
            role="status"
            aria-label="Loading curriculum"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : programs.length === 0 ? (
          <EmptyState
            title="No programs yet"
            action={
              canManagePrograms ? (
                <Button type="button" block={false} onClick={() => navigate("/program-curricula/new")}>
                  New Curricula
                </Button>
              ) : undefined
            }
          >
            {canManagePrograms
              ? "Create the first program and its curriculum to get started."
              : "Ask an administrator or registrar to create the first program."}
          </EmptyState>
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
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${selectedCode}-${viewMode}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
              >
                <CurriculumTable
                  curriculum={curriculum}
                  search={search}
                  viewMode={viewMode}
                  onEditSubject={setEditSubjectTarget}
                  onArchiveSubject={setArchiveSubjectTarget}
                />
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>

      <Modal open={editProgramTarget !== null} onClose={() => setEditProgramTarget(null)} title="Edit Program">
        {editProgramTarget && (
          <ProgramForm
            program={editProgramTarget}
            departments={departments}
            onSubmit={handleEditProgram}
            onCancel={() => setEditProgramTarget(null)}
          />
        )}
      </Modal>

      <ProgramArchiveDialog
        program={archiveProgramTarget}
        onClose={() => setArchiveProgramTarget(null)}
        onConfirm={handleArchiveProgram}
      />

      <Modal open={editSubjectTarget !== null} onClose={() => setEditSubjectTarget(null)} title="Edit Subject">
        {editSubjectTarget && (
          <SubjectForm
            subject={editSubjectTarget}
            allSubjects={allSubjects}
            subjectTypes={subjectTypes}
            onSubmit={handleEditSubject}
            onCancel={() => setEditSubjectTarget(null)}
          />
        )}
      </Modal>

      <SubjectArchiveDialog
        subject={archiveSubjectTarget}
        onClose={() => setArchiveSubjectTarget(null)}
        onConfirm={handleArchiveSubject}
      />
    </div>
  );
}
