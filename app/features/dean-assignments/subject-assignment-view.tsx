import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { EmptyState } from "~/components/feedback/empty-state";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { ConfirmDialog } from "~/components/ui/modal";
import {
  BookOpenIcon,
  ClockIcon,
  EyeIcon,
  LayersIcon,
  PlusIcon,
  TrashIcon,
} from "~/components/ui/icons";
import { SubjectAssignmentToolbar } from "~/features/dean-assignments/subject-assignment-toolbar";
import { EditSubjectsModal } from "~/features/dean-assignments/edit-subjects-modal";
import { useDeanSubjectAssignments } from "~/features/dean-assignments/use-dean-subject-assignments";
import { PageHeader } from "~/layouts/page-header";
import type {
  DepartmentSubjectProgram,
  FacultyLoadingEntry,
} from "~/types/faculty-load";

function initials(name: string) {
  return name.split(" ")[0]?.[0]?.toUpperCase() ?? "";
}

function allSubjects(program: DepartmentSubjectProgram) {
  return program.curriculumDetails.flatMap((year) =>
    year.semesterDetails.flatMap((semester) => semester.subjects),
  );
}

function Summary({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex min-w-32 items-center gap-3 border-l border-slate-200 pl-5 dark:border-white/10">
      <span className="text-navy-700 dark:text-white">{icon}</span>
      <div>
        <p className="font-body text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 font-body text-base font-bold text-navy-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ProgramPanels({
  entry,
  programs,
  onEditSubjects,
  onDeleteSubject,
}: {
  entry: FacultyLoadingEntry;
  programs: DepartmentSubjectProgram[];
  onEditSubjects?: (entry: FacultyLoadingEntry) => void;
  onDeleteSubject?: (entry: FacultyLoadingEntry, subject: FacultyLoadingEntry["subjects"][number]) => void;
}) {
  const groups = new Map<string, { program: DepartmentSubjectProgram; rows: FacultyLoadingEntry["subjects"] }>();
  entry.subjects.forEach((subject) => {
    const program = programs.find((item) =>
      allSubjects(item).some((row) => row.subjectCode === subject.subjectCode),
    );
    if (!program) return;
    const key = program.programAbbrev || program.programName;
    const old = groups.get(key);
    groups.set(key, { program, rows: old ? [...old.rows, subject] : [subject] });
  });
  const groupCount = groups.size;

  return (
    <div className={`grid gap-4 p-4 ${groupCount <= 1 ? "grid-cols-1" : "xl:grid-cols-2"}`}>
      {[...groups.values()].map(({ program, rows }) => {
        const totalUnits = rows.reduce((sum, s) => sum + s.units.total, 0);

        return (
          <section
            key={program.programAbbrev || program.programName}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
          >
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div>
                <h3 className="font-body text-sm font-bold text-navy-800 dark:text-white">
                  {program.programAbbrev || program.programName}
                </h3>
                <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">{program.programName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEditSubjects?.(entry)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 font-body text-xs font-medium text-navy-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <PlusIcon />
                  Assign Subject
                </button>
              </div>
            </header>
            <table className="w-full font-body text-sm">
              <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Descriptive Title</th>
                  <th className="px-3 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Lec</th>
                  <th className="px-3 py-3 text-right">Lab</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((subject, index) => (
                  <tr key={subject.subjectCode} className="border-t border-slate-200 dark:border-white/10">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{index + 1}</td>
                    <td className="px-3 py-3 font-semibold text-navy-800 dark:text-white">{subject.subjectCode}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{subject.descriptiveTitle}</td>
                    <td className="px-3 py-3 text-right font-semibold">{subject.units.total}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{subject.units.lecHours}</td>
                    <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300">{subject.units.labHours}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteSubject?.(entry, subject)}
                        className="grid size-7 place-items-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        aria-label={`Remove ${subject.subjectCode}`}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-white/10">
                  <td colSpan={3} className="px-4 py-3 font-semibold text-navy-800 dark:text-white">
                    Program Total
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-navy-800 dark:text-white">{totalUnits}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                    {rows.reduce((sum, s) => sum + s.units.lecHours, 0)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                    {rows.reduce((sum, s) => sum + s.units.labHours, 0)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </section>
        );
      })}
    </div>
  );
}

export function SubjectAssignmentView() {
  const data = useDeanSubjectAssignments();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [editSubjectsTarget, setEditSubjectsTarget] = useState<FacultyLoadingEntry | null>(null);
  const [deleteTermTarget, setDeleteTermTarget] = useState<FacultyLoadingEntry | null>(null);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<{
    entry: FacultyLoadingEntry;
    subject: FacultyLoadingEntry["subjects"][number];
  } | null>(null);
  const [deleteCascade, setDeleteCascade] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const entries = (data.entries ?? []).filter((entry) =>
    `${entry.instructorName} ${entry.department}`.toLowerCase().includes(search.toLowerCase()),
  );
  const loading = data.termsLoading || data.semestersLoading || data.entries === null || data.subjects === null;

  const totalInstructors = entries.length;
  const totalPrograms = new Set(
    entries.flatMap((entry) =>
      entry.subjects.flatMap((subject) =>
        (data.subjects ?? [])
          .filter((program) =>
            allSubjects(program).some((row) => row.subjectCode === subject.subjectCode),
          )
          .map((program) => program.programAbbrev || program.programName),
      ),
    ),
  ).size;
  const totalSubjects = entries.reduce((sum, entry) => sum + entry.subjects.length, 0);

  async function handleDeleteTerm() {
    if (!deleteTermTarget?.teachingTermId) return;
    setDeleting(true);
    try {
      await data.deleteTeachingTerm(deleteTermTarget.teachingTermId, deleteCascade);
      setDeleteTermTarget(null);
      setDeleteCascade(false);
    } catch (err) {
      if (err instanceof Error && (err.message.includes("409") || err.message.includes("subject assignment"))) {
        setDeleteCascade(true);
        throw err;
      }
      throw err;
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteSubject() {
    if (!deleteSubjectTarget) return;
    const { entry, subject } = deleteSubjectTarget;
    const assignmentId = entry.subjectAssignmentIds?.get(subject.subjectCode);
    if (!entry.teachingTermId || assignmentId == null) return;
    await data.deleteAssignment(entry.teachingTermId, assignmentId);
    setDeleteSubjectTarget(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Subject Assignments"
        description="Assign and manage instructors' subject loads for the selected academic term."
      />

      <SubjectAssignmentToolbar
        schoolYears={data.schoolYears}
        selectedSchoolYearId={data.selectedSchoolYearId}
        onSchoolYearChange={data.setSelectedSchoolYearId}
        semesters={data.semesters}
        selectedSemesterId={data.selectedSemesterId}
        semesterLabel={data.semesterLabel}
        onSemesterChange={data.setSelectedSemesterId}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="mt-6">
        {loading ? (
          <p className="py-12 text-center font-body text-sm text-slate-500">Loading subject assignments…</p>
        ) : data.loadError ? (
          <EmptyState title="Unable to load assignments">{data.loadError}</EmptyState>
        ) : entries.length === 0 ? (
          <EmptyState title="No assignments found">Try another academic term or search.</EmptyState>
        ) : (
          <Accordion>
            {entries.map((entry) => {
              const count = new Set(
                entry.subjects.flatMap((subject) =>
                  (data.subjects ?? [])
                    .filter((program) =>
                      allSubjects(program).some((row) => row.subjectCode === subject.subjectCode),
                    )
                    .map((program) => program.programAbbrev || program.programName),
                ),
              ).size;

              const title = (
                <div className="grid gap-5 lg:grid-cols-[1.45fr_repeat(3,.8fr)_auto] lg:items-center">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-sm font-medium text-white dark:bg-white dark:text-navy-900">
                      {initials(entry.instructorName)}
                    </span>
                    <div>
                      <h2 className="font-body text-base font-bold text-navy-800 dark:text-white">
                        {entry.instructorName}
                      </h2>
                      <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
                        {entry.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-32 items-center gap-3 border-l border-slate-200 pl-5 dark:border-white/10">
                    <span className="text-navy-700 dark:text-white">
                      <ClockIcon size={19} />
                    </span>
                    <div>
                      <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                        Maximum Weekly Hours
                      </p>
                      <div className="mt-1 flex items-center">
                        <input
                          type="number"
                          min="1"
                          value={entry.maxWeeklyHours ?? ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (entry.teachingTermId && !isNaN(val) && val > 0) {
                              data.updateMaxWeeklyHours(entry.teachingTermId, val);
                            }
                          }}
                          className="w-16 rounded-l-lg border border-slate-300 bg-white px-2 py-1 font-body text-sm font-semibold text-navy-800 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
                        />
                        <span className="rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-2 py-1 font-body text-xs text-slate-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-400">
                          hrs
                        </span>
                      </div>
                    </div>
                  </div>

                  <Summary icon={<LayersIcon />} label="Assigned Programs" value={count} />

                  <div className="flex min-w-32 items-center gap-3 border-l border-slate-200 pl-5 dark:border-white/10">
                    <span className="text-navy-700 dark:text-white">
                      <BookOpenIcon />
                    </span>
                    <div>
                      <p className="font-body text-xs text-slate-500 dark:text-slate-400">Assigned Subjects</p>
                      <p className="mt-1 font-body text-base font-bold text-navy-800 dark:text-white">
                        {entry.subjects.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-5 dark:border-white/10">
                    {entry.teachingTermId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dean/teaching-terms/${entry.teachingTermId}`);
                        }}
                        className="grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-navy-100 hover:text-navy-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                        aria-label="View schedule detail"
                        title="View schedule detail"
                      >
                        <EyeIcon />
                      </button>
                    )}
                    {entry.teachingTermId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCascade(false);
                          setDeleteTermTarget(entry);
                        }}
                        className="grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        aria-label="Delete teaching term"
                        title="Delete teaching term"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
              );

              return (
                <AccordionItem key={entry.instructorName} title={title}>
                  <ProgramPanels
                    entry={entry}
                    programs={data.subjects ?? []}
                    onEditSubjects={(e) => setEditSubjectsTarget(e)}
                    onDeleteSubject={(e, subject) => setDeleteSubjectTarget({ entry: e, subject })}
                  />
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {entries.length > 0 && (
        <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white/95 px-6 py-3.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-surface/95">
          <div className="flex flex-wrap items-center gap-6 font-body text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Instructors</span>
              <span className="font-bold text-navy-800 dark:text-white">{totalInstructors}</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Programs</span>
              <span className="font-bold text-navy-800 dark:text-white">{totalPrograms}</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Subjects</span>
              <span className="font-bold text-navy-800 dark:text-white">{totalSubjects}</span>
            </div>
          </div>
        </div>
      )}

      {editSubjectsTarget &&
        (() => {
          const curriculumDetailIdMap = new Map<string, number>();
          for (const entry of data.entries ?? []) {
            for (const s of entry.subjects) {
              if (s.curriculumDetailId != null && !curriculumDetailIdMap.has(s.subjectCode)) {
                curriculumDetailIdMap.set(s.subjectCode, s.curriculumDetailId);
              }
            }
          }
          return (
            <EditSubjectsModal
              open
              onClose={() => setEditSubjectsTarget(null)}
              instructorName={editSubjectsTarget.instructorName}
              teachingTermId={editSubjectsTarget.teachingTermId!}
              currentSubjects={editSubjectsTarget.subjects}
              programs={data.subjects ?? []}
              curriculumDetailIdMap={curriculumDetailIdMap}
              onSave={data.updateSubjects}
            />
          );
        })()}

      <ConfirmDialog
        open={deleteSubjectTarget !== null}
        onClose={() => setDeleteSubjectTarget(null)}
        title="Remove Subject Assignment"
        confirmLabel="Remove Subject"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={handleDeleteSubject}
      >
        <p>
          This will remove <strong>{deleteSubjectTarget?.subject.subjectCode}</strong>
          {deleteSubjectTarget?.subject.descriptiveTitle
            ? ` — ${deleteSubjectTarget.subject.descriptiveTitle}`
            : ""}{" "}
          from <strong>{deleteSubjectTarget?.entry.instructorName}</strong>&apos;s assignments. If the subject is
          already scheduled, the removal will be blocked.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteTermTarget !== null}
        onClose={() => {
          setDeleteTermTarget(null);
          setDeleteCascade(false);
        }}
        title={deleteCascade ? "Delete Term with Assignments" : "Delete Teaching Term"}
        confirmLabel={deleteCascade ? "Delete All" : "Delete Term"}
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={handleDeleteTerm}
      >
        {deleteCascade ? (
          <p>
            This will permanently delete <strong>{deleteTermTarget?.instructorName}</strong>&apos;s teaching term,
            its daily loads, <strong>and all {deleteTermTarget?.subjects.length ?? 0} subject assignment(s)</strong>.
            If any subject is already scheduled, the deletion will be blocked.
          </p>
        ) : (
          <p>
            This will delete <strong>{deleteTermTarget?.instructorName}</strong>&apos;s teaching term and its daily
            loads. If it still has subject assignments, you&apos;ll be asked to confirm again with cascade enabled.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
