import { useCallback, useEffect, useState } from "react";
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

    // Build a subjectCode → { descriptiveTitle, units } lookup from the curriculum tree.
    const subjectLookup = new Map<string, { descriptiveTitle: string; units: { total: number; lecHours: number; labHours: number } }>();
    for (const program of subjects ?? []) {
      for (const year of program.curriculumDetails) {
        for (const sem of year.semesterDetails) {
          for (const subj of sem.subjects) {
            if (!subjectLookup.has(subj.subjectCode)) {
              subjectLookup.set(subj.subjectCode, {
                descriptiveTitle: subj.descriptiveTitle,
                units: { total: subj.units, lecHours: 0, labHours: 0 },
              });
            }
          }
        }
      }
    }

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
            subjects: (tt.subjectAssignments ?? []).map((sa) => {
              const info = subjectLookup.get(sa.subjectCode);
              return {
                subjectCode: sa.subjectCode,
                descriptiveTitle: info?.descriptiveTitle ?? "",
                units: info?.units ?? { total: 0, lecHours: 0, labHours: 0 },
                schedules: [],
                curriculumDetailId: sa.curriculumDetailId,
              };
            }),
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
  }, [selectedSchoolYearId, selectedSemesterId, subjects]);

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

  async function deleteAssignment(teachingTermId: number, assignmentId: number) {
    setMutating(true);
    try {
      const message = await deanService.removeSubjectAssignment(teachingTermId, assignmentId);
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

  async function updateSubjects(teachingTermId: number, payload: { maxWeeklyHours?: number; curriculumDetailIds: number[] }) {
    const message = await deanService.updateTeachingTerm(teachingTermId, payload);
    if (message) toast.success(message);
    refresh();
  }

  async function deleteTeachingTerm(teachingTermId: number, cascade: boolean) {
    const message = await deanService.deleteTeachingTerm(teachingTermId, cascade);
    if (message) toast.success(message);
    refresh();
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
