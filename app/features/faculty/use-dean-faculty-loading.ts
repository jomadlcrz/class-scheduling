import { useEffect, useMemo, useState } from "react";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { facultyLoadService } from "~/services/faculty-load.service";
import type { FacultyLoadingEntry } from "~/types/faculty-load";

/**
 * Loads all faculty loading entries for the dean's department via
 * /deans/faculty-loading. Returns the full list plus the currently
 * selected instructor entry.
 */
export function useDeanFacultyLoading() {
  const { schoolYears, defaultSchoolYear, loading: termsLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [entries, setEntries] = useState<FacultyLoadingEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  // Fetch loading data when term changes
  useEffect(() => {
    if (!selectedSchoolYearId || !selectedSemesterId) return;
    let cancelled = false;
    setEntries(null);
    setLoadError(null);
    setSelectedIndex(0);

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

  const matchedSy = schoolYears.find((s) => String(s.id) === selectedSchoolYearId);
  const matchedSem = semesters.find((s) => String(s.id) === selectedSemesterId);

  const schoolYearLabel = matchedSy?.schoolYear ?? "";
  const semesterName = matchedSem ? semesterLabel(matchedSem.semesterNumber) : "";

  const selectedEntry = useMemo(
    () => entries?.[selectedIndex] ?? null,
    [entries, selectedIndex],
  );

  return {
    isLoading: entries === null,
    loadError,
    termsLoading,
    semestersLoading,
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
    // Instructor
    entries,
    selectedEntry,
    selectedIndex,
    setSelectedIndex,
  };
}
