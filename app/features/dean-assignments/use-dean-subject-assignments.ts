import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { deanService, type DepartmentInstructor } from "~/services/dean.service";
import { facultyLoadService } from "~/services/faculty-load.service";
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

    facultyLoadService
      .getFacultyLoading(Number(selectedSchoolYearId), Number(selectedSemesterId))
      .then((data) => {
        if (!cancelled) setEntries(data);
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
    refresh,
  };
}
