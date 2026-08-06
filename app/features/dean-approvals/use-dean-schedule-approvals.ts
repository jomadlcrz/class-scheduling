import { useCallback, useEffect, useMemo, useState } from "react";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import type { DeanApprovalsInbox } from "~/types/schedule-release";

/**
 * Dean's schedule-approvals inbox for a selected school year + semester.
 * Term selection is local state (no shared context needed), mirroring
 * useDeanFacultyLoading — same default-selection pattern.
 */
export function useDeanScheduleApprovals() {
  const { schoolYears, defaultSchoolYear, loading: termsLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState("");

  const [inbox, setInbox] = useState<DeanApprovalsInbox | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const refresh = useCallback(async () => {
    if (!selectedSchoolYearId || !selectedSemesterNumber) return;
    const data = await scheduleReleaseService.listApprovals(
      Number(selectedSchoolYearId),
      Number(selectedSemesterNumber),
    );
    setInbox(data);
  }, [selectedSchoolYearId, selectedSemesterNumber]);

  useEffect(() => {
    if (!selectedSchoolYearId || !selectedSemesterNumber) return;
    let cancelled = false;
    setInbox(null);
    setLoadError(null);
    refresh().catch((err) => {
      if (cancelled) return;
      setLoadError(err instanceof Error ? err.message : "Unable to load schedule approvals.");
      setInbox({ term: null, pending: [], recentlyReviewed: [] });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSchoolYearId, selectedSemesterNumber, refresh]);

  const schoolYearLabel = useMemo(
    () => schoolYears.find((s) => String(s.id) === selectedSchoolYearId)?.schoolYear ?? "",
    [schoolYears, selectedSchoolYearId],
  );
  const semesterName = useMemo(() => {
    const matched = semesters.find((s) => String(s.semesterNumber) === selectedSemesterNumber);
    return matched ? semesterLabel(matched.semesterNumber) : "";
  }, [semesters, selectedSemesterNumber, semesterLabel]);

  return {
    isLoading: inbox === null,
    loadError,
    termsLoading,
    semestersLoading,
    schoolYears,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    schoolYearLabel,
    semesters,
    semesterLabel,
    selectedSemesterNumber,
    setSelectedSemesterNumber,
    semesterName,
    inbox,
    refresh,
  };
}
