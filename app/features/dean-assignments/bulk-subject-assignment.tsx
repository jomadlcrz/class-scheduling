import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { inputClassName } from "~/components/ui/input";
import { BookOpenIcon, ClockIcon, LayersIcon, SearchIcon } from "~/components/ui/icons";
import { formatInstructorName } from "~/lib/faculty-load";
import type { DepartmentInstructor } from "~/services/dean.service";
import { SubjectAssignmentToolbar } from "~/features/dean-assignments/subject-assignment-toolbar";
import { useDeanSubjectAssignments } from "~/features/dean-assignments/use-dean-subject-assignments";
import { PageHeader } from "~/layouts/page-header";
import type { FacultyLoadingEntry } from "~/types/faculty-load";

type InstructorState = { hours: string; selected: Set<string> };
const keyFor = (instructor: DepartmentInstructor) => `${instructor.firstName}|${instructor.lastName}`;
function instructorInitials(i: DepartmentInstructor) { return i.lastName[0]?.toUpperCase() ?? ""; }
function Summary({ icon, label, value }: { icon: ReactNode; label: ReactNode; value: ReactNode }) { return <div className="flex min-w-32 items-center gap-3 border-l border-slate-200 pl-5 dark:border-white/10"><span className="text-navy-700 dark:text-white">{icon}</span><div><p className="font-body text-xs text-slate-500 dark:text-slate-400">{label}</p><div className="mt-1 font-body text-base font-bold text-navy-800 dark:text-white">{value}</div></div></div>; }

export function BulkSubjectAssignment() {
  const data = useDeanSubjectAssignments(); const navigate = useNavigate();
  const [search, setSearch] = useState(""); const [states, setStates] = useState<Record<string, InstructorState>>({});
  const [subjectSearch, setSubjectSearch] = useState("");
  const seededTermRef = useRef("");

  // Seed states from existing subject assignments when the term changes.
  useEffect(() => {
    const termKey = `${data.selectedSchoolYearId}|${data.selectedSemesterId}`;
    if (termKey === seededTermRef.current) return;
    if (!data.entries || !data.instructors || !data.subjects) return;
    seededTermRef.current = termKey;

    const normalize = (name: string) => name.replace(/[.,]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
    const entryByName = new Map<string, FacultyLoadingEntry>();
    for (const entry of data.entries) {
      entryByName.set(normalize(entry.instructorName), entry);
    }

    const next: Record<string, InstructorState> = {};
    for (const instructor of data.instructors) {
      const fullName = formatInstructorName(instructor);
      const entry = entryByName.get(normalize(fullName));
      if (!entry) {
        next[keyFor(instructor)] = { hours: "", selected: new Set() };
        continue;
      }

      const selected = new Set<string>();
      for (const subject of entry.subjects) {
        for (const program of data.subjects!) {
          const allSubjects = program.curriculumDetails.flatMap((y) => y.semesterDetails.flatMap((s) => s.subjects));
          if (allSubjects.some((s) => s.subjectCode === subject.subjectCode)) {
            selected.add(`${program.programAbbrev || program.programName}:${subject.subjectCode}`);
            break;
          }
        }
      }

      next[keyFor(instructor)] = {
        hours: entry.maxWeeklyHours != null ? String(entry.maxWeeklyHours) : "",
        selected,
      };
    }

    setStates(next);
  }, [data.entries, data.instructors, data.subjects, data.selectedSchoolYearId, data.selectedSemesterId]);

  const stateFor = (instructor: DepartmentInstructor) => states[keyFor(instructor)] ?? { hours: "", selected: new Set<string>() };
  const update = (instructor: DepartmentInstructor, fn: (value: InstructorState) => InstructorState) => setStates((all) => ({ ...all, [keyFor(instructor)]: fn(all[keyFor(instructor)] ?? { hours: "", selected: new Set<string>() }) }));
  const instructors = (data.instructors ?? []).filter((instructor) => `${formatInstructorName(instructor)} ${instructor.department}`.toLowerCase().includes(search.toLowerCase()));
  async function save() { const instructorLoads = (data.instructors ?? []).flatMap((instructor) => { const state = stateFor(instructor); const programs = (data.subjects ?? []).flatMap((program) => { const prefix = program.programAbbrev || program.programName; const subjects = program.curriculumDetails.flatMap((year) => year.semesterDetails.flatMap((semester) => semester.subjects)).filter((subject) => state.selected.has(`${prefix}:${subject.subjectCode}`)).map((subject) => ({ subjectCode: subject.subjectCode, descriptiveTitle: subject.descriptiveTitle })); return subjects.length ? [{ programAbbrev: program.programAbbrev, subjects }] : []; }); return programs.length && Number(state.hours) > 0 ? [{ firstName: instructor.firstName, lastName: instructor.lastName, maxWeeklyHours: Number(state.hours), programs }] : []; }); if (instructorLoads.length) { await data.createAssignments(instructorLoads); navigate("/dean/subject-assignments"); } }
  const loading = data.termsLoading || data.semestersLoading || data.instructors === null || data.subjects === null;
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><PageHeader title="Assign Subjects" description="Assign subjects to instructors for the selected academic term." /><SubjectAssignmentToolbar schoolYears={data.schoolYears} selectedSchoolYearId={data.selectedSchoolYearId} onSchoolYearChange={data.setSelectedSchoolYearId} semesters={data.semesters} selectedSemesterId={data.selectedSemesterId} semesterLabel={data.semesterLabel} onSemesterChange={data.setSelectedSemesterId} search={search} onSearchChange={setSearch} /><div className="mt-6">{loading ? <p className="py-12 text-center font-body text-sm text-slate-500">Loading instructors and curriculum…</p> : data.loadError ? <EmptyState title="Unable to load assignment data">{data.loadError}</EmptyState> : <Accordion>{instructors.map((instructor) => { const key = keyFor(instructor); const state = stateFor(instructor); const programs = new Set([...state.selected].map((item) => item.split(":")[0])).size; return <AccordionItem key={key} title={<div className="grid w-full gap-5 lg:grid-cols-[1.45fr_repeat(3,.8fr)] lg:items-center"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-navy-800 font-body text-sm font-medium text-white dark:bg-white dark:text-navy-900">{instructorInitials(instructor)}</span><div><h2 className="font-body text-base font-bold text-navy-800 dark:text-white">{formatInstructorName(instructor)}</h2><p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">{instructor.department}</p></div></div><Summary icon={<ClockIcon size={19} />} label={<><span>Maximum Weekly Hours </span><span className="text-red-600">*</span></>} value={<div className="flex w-28 items-center"><input id={`hours-${key}`} type="number" min="1" value={state.hours} onClick={(event) => event.stopPropagation()} onChange={(event) => update(instructor, (current) => ({ ...current, hours: event.target.value }))} className={`${inputClassName} rounded-r-none py-1.5 font-semibold`} /><span className="rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-2 py-1.5 font-body text-sm dark:border-white/15 dark:bg-white/10">hrs</span></div>} /><Summary icon={<LayersIcon />} label="Assigned Programs" value={programs} /><Summary icon={<BookOpenIcon />} label="Selected Subjects" value={state.selected.size} /></div>}><div className={`grid gap-4 bg-slate-50/60 p-4 ${(data.subjects ?? []).length <= 1 ? "grid-cols-1" : "xl:grid-cols-2"} dark:bg-navy-950/30`}>{(data.subjects ?? []).map((program) => { const prefix = program.programAbbrev || program.programName; const allSubjects = program.curriculumDetails.flatMap((year) => year.semesterDetails.flatMap((semester) => semester.subjects)); const sq = subjectSearch.toLowerCase(); const subjects = sq ? allSubjects.filter((subject) => subject.subjectCode.toLowerCase().includes(sq) || subject.descriptiveTitle.toLowerCase().includes(sq)) : allSubjects; const count = allSubjects.filter((subject) => state.selected.has(`${prefix}:${subject.subjectCode}`)).length; return <section key={prefix} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"><header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10"><div><h3 className="font-body text-sm font-bold text-navy-800 dark:text-white">{program.programName}</h3><p className="mt-1 font-body text-xs text-slate-500">{prefix}</p></div><span className="rounded-full bg-navy-100 px-2.5 py-1 font-body text-xs font-semibold text-navy-800 dark:bg-white/10 dark:text-white">{count} / {allSubjects.length} selected</span></header><div className="border-t border-slate-100 px-4 py-2 dark:border-white/10"><div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500"><SearchIcon size={18} /></span><input type="search" value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder={`Search ${prefix} subjects\u2026`} className={`${inputClassName} py-1.5 pl-9 text-xs`} /></div></div><div className="max-h-80 overflow-y-auto">{subjects.length === 0 ? <p className="px-4 py-6 text-center font-body text-sm text-slate-400">No matching subjects.</p> : subjects.map((subject) => { const subjectKey = `${prefix}:${subject.subjectCode}`; return <div key={subject.subjectCode} className="grid grid-cols-[auto_7rem_1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-white/10"><Checkbox id={`${key}-${subjectKey}`} label="" ariaLabel={`Assign ${subject.subjectCode}`} checked={state.selected.has(subjectKey)} onChange={(checked) => update(instructor, (current) => { const selected = new Set(current.selected); checked ? selected.add(subjectKey) : selected.delete(subjectKey); return { ...current, selected }; })} /><span className="font-body text-sm font-semibold text-navy-800 dark:text-white">{subject.subjectCode}</span><span className="font-body text-sm text-slate-600 dark:text-slate-300">{subject.descriptiveTitle}</span><span className="font-body text-xs font-semibold text-slate-500">{subject.units} units</span></div>; })}</div></section>; })}</div></AccordionItem>; })}</Accordion>}</div><div className="sticky bottom-0 mt-8 flex justify-between border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur dark:border-white/10 dark:bg-surface/95"><Button type="button" variant="outline" block={false} onClick={() => navigate("/dean/subject-assignments")}>Cancel</Button><Button type="button" block={false} isLoading={data.mutating} loadingLabel="Saving…" onClick={save}>Save Assignments</Button></div></div>;
}
