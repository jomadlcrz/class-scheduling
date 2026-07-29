import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { formatInstructorName } from "~/lib/faculty-load";
import { deanService, type DepartmentInstructor } from "~/services/dean.service";
import { programService } from "~/services/program.service";
import type {
  DepartmentSubjectProgram,
  FacultyLoadingEntry,
  TeachingTermDetail,
} from "~/types/faculty-load";

/** Rebuilds one entry from the rich term payload the backend returns on GET/PUT — no refetch needed. */
function entryFromTermDetail(detail: TeachingTermDetail, prev?: FacultyLoadingEntry): FacultyLoadingEntry {
  const assignments = detail.subject_assignments ?? [];
  const subjectAssignmentIds = new Map<string, number>();
  for (const a of assignments) {
    if (a.subject_code) subjectAssignmentIds.set(a.subject_code, a.subject_assignment_id);
  }
  return {
    instructorName: detail.instructor.full_name ?? prev?.instructorName ?? "",
    department: detail.instructor.department ?? prev?.department ?? "",
    semester: prev?.semester ?? "",
    academicYear: prev?.academicYear ?? "",
    maxWeeklyHours: detail.hours.max_weekly_hours,
    teachingTermId: detail.teaching_term_id,
    subjectAssignmentIds,
    subjects: assignments.map((a) => ({
      subjectCode: a.subject_code ?? "",
      descriptiveTitle: a.descriptive_title ?? "",
      units: { total: a.units, lecHours: a.lec_hours, labHours: a.lab_hours },
      schedules: [],
      curriculumDetailId: a.curriculum_detail_id,
    })),
  };
}

export function useDeanSubjectAssignments() {
  const { schoolYears, defaultSchoolYear, loading: termsLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");

  const [instructors, setInstructors] = useState<DepartmentInstructor[] | null>(null);
  const [subjects, setSubjects] = useState<DepartmentSubjectProgram[] | null>(null);
  const [entries, setEntries] = useState<FacultyLoadingEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  // Default school year
  useEffect(() => {
    if (selectedSchoolYearId || schoolYears.length === 0) return;
    const match = schoolYears.find((s) => s.schoolYear === defaultSchoolYear) ?? schoolYears[0];
    if (match) setSelectedSchoolYearId(String(match.id));
  }, [schoolYears, defaultSchoolYear, selectedSchoolYearId]);

  // Default semester
  useEffect(() => {
    if (selectedSemesterId || semesters.length === 0) return;
    const first = semesters.find((s) => s.semesterNumber !== 3) ?? semesters[0];
    if (first) setSelectedSemesterId(String(first.id));
  }, [semesters, selectedSemesterId]);

  // Fetch instructors + subjects + programs (term-independent)
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      deanService.listDepartmentInstructors(),
      deanService.listDepartmentSubjects(),
      programService.list().catch(() => [] as Awaited<ReturnType<typeof programService.list>>),
    ]).then(([inst, subj, progs]) => {
      if (cancelled) return;
      const nameToAbbrev = new Map(progs.map((p) => [p.name, p.abbrev]));
      setInstructors(inst);
      setSubjects(subj.map((s) => ({
        ...s,
        programAbbrev: nameToAbbrev.get(s.programName) ?? "",
      })));
    }).catch((err) => {
      if (!cancelled) {
        setLoadError(err instanceof Error ? err.message : "Unable to load department data.");
        setInstructors([]);
        setSubjects([]);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(() => {
    if (!selectedSchoolYearId || !selectedSemesterId) return;
    let cancelled = false;
    setEntries(null);
    setLoadError(null);

    const syId = Number(selectedSchoolYearId);
    const semId = Number(selectedSemesterId);

    deanService.listTeachingTerms({ syId, semId })
      .then((teachingTerms) => {
        if (cancelled) return;
        const entries: FacultyLoadingEntry[] = teachingTerms.map((tt) => {
          const assignmentIdMap = new Map(
            (tt.subjectAssignments ?? []).map((sa) => [sa.subjectCode, sa.subjectAssignmentId]),
          );
          return {
            instructorName: tt.instructorName,
            department: tt.department ?? "",
            semester: "",
            academicYear: "",
            maxWeeklyHours: tt.maxWeeklyHours,
            teachingTermId: tt.id,
            subjectAssignmentIds: assignmentIdMap,
            subjects: (tt.subjectAssignments ?? []).map((sa) => ({
              subjectCode: sa.subjectCode,
              descriptiveTitle: sa.descriptiveTitle,
              units: { total: sa.units, lecHours: sa.lecHours, labHours: sa.labHours },
              schedules: [],
              curriculumDetailId: sa.curriculumDetailId,
              programAbbrev: sa.programAbbrev,
            })),
          };
        });
        setEntries(entries);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Unable to load subject assignments.");
        setEntries([]);
      });

    return () => { cancelled = true; };
  }, [selectedSchoolYearId, selectedSemesterId]);

  useEffect(() => {
    const cleanup = refresh();
    return cleanup;
  }, [refresh]);

  // Patch instructors' department with full names from entries (entries have department_name, instructors have department_abbrev)
  useEffect(() => {
    if (!entries || !instructors) return;
    const nameToDept = new Map(entries.map((e) => [e.instructorName, e.department]));
    setInstructors((prev) => {
      if (!prev) return prev;
      let changed = false;
      const next = prev.map((i) => {
        const full = nameToDept.get(formatInstructorName(i));
        if (full && full !== i.department) {
          changed = true;
          return { ...i, department: full };
        }
        return i;
      });
      return changed ? next : prev;
    });
  }, [entries, instructors]);

  async function createAssignments(
    instructorLoads: {
      firstName: string;
      lastName: string;
      maxWeeklyHours: number;
      programs: { programAbbrev: string; subjects: { subjectCode: string; descriptiveTitle: string }[] }[];
    }[],
  ) {
    setMutating(true);
    try {
      const message = await deanService.createSubjectAssignments(
        Number(selectedSchoolYearId),
        Number(selectedSemesterId),
        instructorLoads,
      );
      if (message) toast.success(message);
      refresh();
    } finally {
      setMutating(false);
    }
  }

  // Mutations patch local state from the response (or locally, for DELETEs)
  // instead of refetching, so the list never drops back to a loading state.
  function patchEntry(term: TeachingTermDetail) {
    setEntries((prev) =>
      prev?.map((entry) =>
        entry.teachingTermId === term.teaching_term_id ? entryFromTermDetail(term, entry) : entry,
      ) ?? prev,
    );
  }

  async function deleteAssignment(teachingTermId: number, assignmentId: number) {
    setMutating(true);
    try {
      const message = await deanService.removeSubjectAssignment(teachingTermId, assignmentId);
      if (message) toast.success(message);
      setEntries((prev) =>
        prev?.map((entry) => {
          if (entry.teachingTermId !== teachingTermId) return entry;
          const code = [...(entry.subjectAssignmentIds ?? [])].find(([, id]) => id === assignmentId)?.[0];
          if (!code) return entry;
          const nextIds = new Map(entry.subjectAssignmentIds ?? []);
          nextIds.delete(code);
          return {
            ...entry,
            subjectAssignmentIds: nextIds,
            subjects: entry.subjects.filter((s) => s.subjectCode !== code),
          };
        }) ?? prev,
      );
    } finally {
      setMutating(false);
    }
  }

  // Debounced per term: the hours input fires on every keystroke, but the PUT
  // goes out only once typing pauses. Local state updates immediately so the
  // controlled input reflects what's typed.
  const hoursTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const timers = hoursTimers.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  function updateMaxWeeklyHours(teachingTermId: number, hours: number) {
    setEntries((prev) =>
      prev?.map((entry) =>
        entry.teachingTermId === teachingTermId ? { ...entry, maxWeeklyHours: hours } : entry,
      ) ?? prev,
    );
    const timers = hoursTimers.current;
    const pending = timers.get(teachingTermId);
    if (pending) clearTimeout(pending);
    timers.set(teachingTermId, setTimeout(async () => {
      timers.delete(teachingTermId);
      try {
        const { message, term } = await deanService.updateTeachingTerm(teachingTermId, { maxWeeklyHours: hours });
        if (term) patchEntry(term);
        if (message) toast.success(message);
      } catch (err) {
        if (err instanceof Error && err.message) toast.error(err.message);
        // Restore the server's value so the input doesn't keep a rejected edit.
        try {
          patchEntry(await deanService.getTeachingTermDetail(teachingTermId));
        } catch { /* term may be gone — leave local state as-is */ }
      }
    }, 600));
  }

  async function updateSubjects(teachingTermId: number, payload: { maxWeeklyHours?: number; curriculumDetailIds: number[] }) {
    const { message, term } = await deanService.updateTeachingTerm(teachingTermId, payload);
    if (term) patchEntry(term);
    if (message) toast.success(message);
  }

  async function deleteTeachingTerm(teachingTermId: number, cascade: boolean) {
    const message = await deanService.deleteTeachingTerm(teachingTermId, cascade);
    if (message) toast.success(message);
    setEntries((prev) => prev?.filter((entry) => entry.teachingTermId !== teachingTermId) ?? prev);
  }

  async function fetchTeachingTermDetail(id: number): Promise<TeachingTermDetail> {
    return deanService.getTeachingTermDetail(id);
  }

  const matchedSy = schoolYears.find((s) => String(s.id) === selectedSchoolYearId);
  const matchedSem = semesters.find((s) => String(s.id) === selectedSemesterId);
  const schoolYearLabel = matchedSy?.schoolYear ?? "";
  const semesterName = matchedSem ? semesterLabel(matchedSem.semesterNumber) : "";

  return {
    termsLoading,
    semestersLoading,
    loadError,
    mutating,
    // School year
    schoolYearLabel,
    schoolYears,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    // Semester
    semesterName,
    semesters,
    semesterLabel,
    selectedSemesterId,
    setSelectedSemesterId,
    // Data
    instructors,
    subjects,
    entries,
    // Actions
    createAssignments,
    deleteAssignment,
    deleteTeachingTerm,
    fetchTeachingTermDetail,
    updateMaxWeeklyHours,
    updateSubjects,
    refresh,
  };
}
