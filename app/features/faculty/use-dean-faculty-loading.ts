import { useEffect, useMemo, useState } from "react";
import { useCachedData } from "~/hooks/use-cached-data";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { deanService } from "~/services/dean.service";
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
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Term-scoped faculty loading; cached per term so revisits skip the skeleton.
  const loadKey = `dean-faculty-loading:${selectedSchoolYearId || "none"}:${selectedSemesterNumber || "none"}`;
  const { data: entries, error: loadError } = useCachedData(
    loadKey,
    () => deanService.getFacultyLoading(Number(selectedSchoolYearId), Number(selectedSemesterNumber)),
    { enabled: Boolean(selectedSchoolYearId && selectedSemesterNumber) },
  );

  // Default school year
  useEffect(() => {
    if (selectedSchoolYearId || schoolYears.length === 0) return;
    const match = schoolYears.find((s) => s.schoolYear === defaultSchoolYear) ?? schoolYears[0];
    if (match) setSelectedSchoolYearId(String(match.id));
  }, [schoolYears, defaultSchoolYear, selectedSchoolYearId]);

  // Default semester
  useEffect(() => {
    if (selectedSemesterNumber || semesters.length === 0) return;
    const first = semesters.find((s) => s.semesterNumber !== 3) ?? semesters[0];
    if (first) setSelectedSemesterNumber(String(first.semesterNumber));
  }, [semesters, selectedSemesterNumber]);

  // Reset the selected instructor whenever the term changes.
  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedSchoolYearId, selectedSemesterNumber]);

  const matchedSy = schoolYears.find((s) => String(s.id) === selectedSchoolYearId);
  const matchedSem = semesters.find((s) => String(s.semesterNumber) === selectedSemesterNumber);

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
    selectedSemesterNumber,
    setSelectedSemesterNumber,
    // Instructor
    entries,
    selectedEntry,
    selectedIndex,
    setSelectedIndex,
  };
}
