import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { deanService, type DepartmentInstructor } from "~/services/dean.service";
import { facultyLoadService } from "~/services/faculty-load.service";
import { formatInstructorName } from "~/lib/faculty-load";
import { programService } from "~/services/program.service";
import type {
  DepartmentSubjectProgram,
  FacultyLoadingEntry,
} from "~/types/faculty-load";

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

    Promise.all([
      facultyLoadService.getFacultyLoading(syId, semId),
      deanService.listTeachingTerms({ syId, semId }),
    ])
      .then(([loadingData, teachingTerms]) => {
        if (cancelled) return;
        // Build a name → teaching-term lookup. The faculty-loading endpoint formats
        // names as "Last, First M." while teaching-terms uses "First Last" — normalise
        // both to "first last" lowercase for matching.
        const normalize = (name: string) =>
          name
            .replace(/[.,]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
        const byName = new Map(teachingTerms.map((t) => [normalize(t.instructorName), t]));
        const merged = loadingData.map((entry) => {
          const tt = byName.get(normalize(entry.instructorName));
          return {
            ...entry,
            teachingTermId: tt?.id ?? null,
            maxWeeklyHours: tt?.maxWeeklyHours ?? entry.maxWeeklyHours,
          };
        });
        setEntries(merged);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Unable to load faculty loading.");
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

  async function deleteAssignment(assignmentId: number) {
    setMutating(true);
    try {
      const message = await facultyLoadService.removeSubjectAssignment(assignmentId);
      if (message) toast.success(message);
      refresh();
    } finally {
      setMutating(false);
    }
  }

  async function updateMaxWeeklyHours(teachingTermId: number, hours: number) {
    const message = await deanService.updateTeachingTerm(teachingTermId, { maxWeeklyHours: hours });
    if (message) toast.success(message);
    refresh();
  }

  async function updateSubjects(teachingTermId: number, curriculumDetailIds: number[]) {
    const message = await deanService.updateTeachingTerm(teachingTermId, { curriculumDetailIds });
    if (message) toast.success(message);
    refresh();
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
    updateMaxWeeklyHours,
    updateSubjects,
    refresh,
  };
}
