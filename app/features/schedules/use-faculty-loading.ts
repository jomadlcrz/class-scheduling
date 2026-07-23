import { useEffect, useMemo, useState } from "react";
import { deanService } from "~/services/dean.service";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import type { ScheduleSemester } from "~/types/schedule";
import type { FacultyLoadingEntry } from "~/types/faculty-load";
import type { Semester } from "~/types/semester";

/**
 * Loads the instructor's own faculty loading via /deans/faculty-loading (the
 * backend scopes rows to the JWT's instructor_id for INSTRUCTOR role).
 * Returns raw FacultyLoadingEntry[] for the structured schedule view.
 */
export function useFacultyLoading() {
  const [entries, setEntries] = useState<FacultyLoadingEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [schoolYearOptions, setSchoolYearOptions] = useState<SchoolYearOption[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<Semester[]>([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<ScheduleSemester>(1);

  const [termsLoading, setTermsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  // Load school years + semesters for the filter dropdowns.
  useEffect(() => {
    Promise.all([schoolYearService.list(), semesterService.list()])
      .then(([years, sems]) => {
        setSchoolYearOptions(years);
        setSemesterOptions(sems);
        if (years.length > 0) setSelectedSchoolYear(years[0].schoolYear);
      })
      .catch(() => setLoadError("Unable to load academic terms."))
      .finally(() => setTermsLoading(false));
  }, []);

  // Fetch faculty loading when the selected term is known.
  useEffect(() => {
    if (!selectedSchoolYear) return;

    const syOption = schoolYearOptions.find((y) => y.schoolYear === selectedSchoolYear);
    const semOption = semesterOptions.find((s) => s.semesterNumber === selectedSemester);
    if (!syOption || !semOption) return;

    setDataLoading(true);
    deanService
      .getFacultyLoading(syOption.id, semOption.id)
      .then((result) => {
        setEntries(result);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load your schedule.");
        setEntries([]);
      })
      .finally(() => setDataLoading(false));
  }, [selectedSchoolYear, selectedSemester, schoolYearOptions, semesterOptions]);

  const schoolYears = useMemo(
    () => schoolYearOptions.map((y) => y.schoolYear).sort((a, b) => b.localeCompare(a)),
    [schoolYearOptions],
  );

  // For the instructor, entries[0] is their own loading.
  const entry = useMemo(() => entries?.[0] ?? null, [entries]);

  return {
    isLoading: dataLoading || entries === null,
    loadError,
    schoolYear: selectedSchoolYear,
    setSchoolYear: setSelectedSchoolYear,
    semester: selectedSemester,
    setSemester: setSelectedSemester,
    schoolYears,
    termsLoading,
    entry,
  };
}
