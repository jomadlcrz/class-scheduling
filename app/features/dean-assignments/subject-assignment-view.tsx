import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { EmptyState } from "~/components/feedback/empty-state";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { BookOpenIcon, CheckIcon, ClockIcon, EditIcon, LayersIcon, PlusIcon } from "~/components/ui/icons";
import { Pagination } from "~/components/ui/pagination";
import { SubjectAssignmentToolbar } from "~/features/dean-assignments/subject-assignment-toolbar";
import { EditSubjectsModal } from "~/features/dean-assignments/edit-subjects-modal";
import { useDeanSubjectAssignments } from "~/features/dean-assignments/use-dean-subject-assignments";
import { PageHeader } from "~/layouts/page-header";
import type { DepartmentSubjectProgram, FacultyLoadingEntry } from "~/types/faculty-load";

const PAGE_SIZE = 5;

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

function ProgramPanels({ entry, programs }: { entry: FacultyLoadingEntry; programs: DepartmentSubjectProgram[] }) {
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
      {[...groups.values()].map(({ program, rows }) => (
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
            <span className="rounded-full bg-navy-100 px-2.5 py-1 font-body text-xs font-semibold text-navy-800 dark:bg-white/10 dark:text-white">
              {rows.length} subject{rows.length === 1 ? "" : "s"}
            </span>
          </header>
          <table className="w-full font-body text-sm">
            <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-3 py-3">Subject Code</th>
                <th className="px-3 py-3">Descriptive Title</th>
                <th className="px-4 py-3 text-right">Units</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((subject, index) => (
                <tr key={subject.subjectCode} className="border-t border-slate-200 dark:border-white/10">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-3 py-3 font-semibold text-navy-800 dark:text-white">{subject.subjectCode}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{subject.descriptiveTitle}</td>
                  <td className="px-4 py-3 text-right font-semibold">{subject.units.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 dark:border-white/10">
                <td colSpan={3} className="px-4 py-3 font-semibold text-navy-800 dark:text-white">
                  Total Subjects
                </td>
                <td className="px-4 py-3 text-right font-bold text-navy-800 dark:text-white">{rows.length}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      ))}
    </div>
  );
}

export function SubjectAssignmentView() {
  const data = useDeanSubjectAssignments();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingHours, setEditingHours] = useState<string | null>(null);
  const [hoursDraft, setHoursDraft] = useState("");
  const [editSubjectsTarget, setEditSubjectsTarget] = useState<FacultyLoadingEntry | null>(null);

  const entries = (data.entries ?? []).filter((entry) =>
    `${entry.instructorName} ${entry.department}`.toLowerCase().includes(search.toLowerCase()),
  );
  const pageEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const loading = data.termsLoading || data.semestersLoading || data.entries === null || data.subjects === null;

  useEffect(() => setPage(1), [search, data.selectedSchoolYearId, data.selectedSemesterId]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Subject Assignments"
        description="View instructors&apos; assigned programs and subjects for the selected academic term."
        actions={
          <Button type="button" block={false} onClick={() => navigate("/dean/subject-assignments/assign")}>
            <PlusIcon /> Bulk Assign
          </Button>
        }
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
          <>
            <Accordion>
              {pageEntries.map((entry) => {
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
                  <div className="grid gap-5 lg:grid-cols-[1.45fr_repeat(3,.8fr)] lg:items-center">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-navy-800 font-body text-sm font-medium text-white dark:bg-white dark:text-navy-900">
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
                        {editingHours === entry.instructorName ? (
                          <div className="mt-1 flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={hoursDraft}
                              onChange={(e) => setHoursDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const val = parseFloat(hoursDraft);
                                  if (entry.teachingTermId && !isNaN(val) && val >= 0) {
                                    if (val !== entry.maxWeeklyHours) data.updateMaxWeeklyHours(entry.teachingTermId, val);
                                    setEditingHours(null);
                                  }
                                }
                                if (e.key === "Escape") setEditingHours(null);
                              }}
                              className="h-7 w-20 rounded border border-gold-400 bg-white px-2 font-body text-sm font-bold text-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-gold-500 dark:bg-navy-900 dark:text-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = parseFloat(hoursDraft);
                                if (entry.teachingTermId && !isNaN(val) && val >= 0) {
                                  if (val !== entry.maxWeeklyHours) data.updateMaxWeeklyHours(entry.teachingTermId, val);
                                  setEditingHours(null);
                                }
                              }}
                              className="grid size-6 place-items-center rounded text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"
                            >
                              <CheckIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingHours(null)}
                              className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingHours(entry.instructorName);
                              setHoursDraft(String(entry.maxWeeklyHours ?? ""));
                            }}
                            className="mt-1 flex items-center gap-1.5 font-body text-base font-bold text-navy-800 hover:text-gold-600 dark:text-white dark:hover:text-gold-400"
                          >
                            <span>
                              {entry.maxWeeklyHours == null ? "—" : `${entry.maxWeeklyHours} hrs`}
                            </span>
                            <EditIcon />
                          </button>
                        )}
                      </div>
                    </div>

                    <Summary icon={<LayersIcon />} label="Assigned Programs" value={count} />

                    <div className="flex min-w-32 items-center gap-3 border-l border-slate-200 pl-5 dark:border-white/10">
                      <span className="text-navy-700 dark:text-white">
                        <BookOpenIcon />
                      </span>
                      <div>
                        <p className="font-body text-xs text-slate-500 dark:text-slate-400">Assigned Subjects</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (entry.teachingTermId) setEditSubjectsTarget(entry);
                          }}
                          disabled={!entry.teachingTermId}
                          className="mt-1 flex items-center gap-1.5 font-body text-base font-bold text-navy-800 hover:text-gold-600 disabled:cursor-default disabled:hover:text-navy-800 dark:text-white dark:hover:text-gold-400 dark:disabled:hover:text-white"
                        >
                          <span>{entry.subjects.length}</span>
                          {entry.teachingTermId && <EditIcon />}
                        </button>
                      </div>
                    </div>
                  </div>
                );

                return (
                  <AccordionItem
                    key={entry.instructorName}
                    title={title}
                  >
                    <ProgramPanels entry={entry} programs={data.subjects ?? []} />
                  </AccordionItem>
                );
              })}
            </Accordion>
            <Pagination
              page={page}
              totalItems={entries.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {editSubjectsTarget && (
        <EditSubjectsModal
          open
          onClose={() => setEditSubjectsTarget(null)}
          instructorName={editSubjectsTarget.instructorName}
          teachingTermId={editSubjectsTarget.teachingTermId!}
          currentSubjects={editSubjectsTarget.subjects}
          programs={data.subjects ?? []}
          onSave={data.updateSubjects}
        />
      )}
    </div>
  );
}
