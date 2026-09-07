import { useEffect, useMemo, useState } from "react";
import { useCachedData } from "~/hooks/use-cached-data";
import { peekCache } from "~/lib/data-cache";
import { scheduleService } from "~/services/schedule.service";
import { DAYS, type Schedule, type ScheduleSemester } from "~/types/schedule";

export type UseMyScheduleOptions = {
  schoolYear?: string | null;
  semester?: number | null;
};

/**
 * Loads the caller's own schedule (student or faculty — the backend scopes rows via
 * the JWT) and defaults the term filter to the latest school year and its first
 * semester. Both /student-schedule and /faculty-schedule are otherwise identical
 * consumers of this data.
 */
export function useMySchedule(options?: UseMyScheduleOptions) {
  const { data: schedules, error: loadError } = useCachedData("my-schedules", () =>
    scheduleService.view(),
  );

  const { data: attestations } = useCachedData("my-schedule-attestations", () =>
    scheduleService.viewAttestations(),
  );

  // Synchronously compute initial school year from cached data or options
  const defaultSchoolYear = useMemo(() => {
    if (options?.schoolYear) return options.schoolYear;
    const list = schedules ?? peekCache<Schedule[]>("my-schedules");
    if (list && list.length > 0) {
      const years = [...new Set(list.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));
      return years[0] ?? "";
    }
    return "";
  }, [options?.schoolYear, schedules]);

  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear);

  const defaultSemester = useMemo<ScheduleSemester>(() => {
    if (options?.semester === 1 || options?.semester === 2 || options?.semester === 3) {
      return options.semester;
    }
    const list = schedules ?? peekCache<Schedule[]>("my-schedules");
    if (list && list.length > 0) {
      const targetYear = options?.schoolYear || defaultSchoolYear;
      const foundSem = list.find((s) => !targetYear || s.schoolYear === targetYear)?.semester;
      if (foundSem) return foundSem;
    }
    return 1;
  }, [options?.semester, options?.schoolYear, defaultSchoolYear, schedules]);

  const [semester, setSemester] = useState<ScheduleSemester>(defaultSemester);

  // Keep state in sync if options change or schedules load asynchronously
  useEffect(() => {
    if (options?.schoolYear) {
      setSchoolYear(options.schoolYear);
    } else if (!schoolYear && schedules && schedules.length > 0) {
      const years = [...new Set(schedules.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));
      const firstYear = years[0] ?? "";
      if (firstYear) setSchoolYear(firstYear);
    }
  }, [options?.schoolYear, schedules, schoolYear]);

  useEffect(() => {
    if (options?.semester === 1 || options?.semester === 2 || options?.semester === 3) {
      setSemester(options.semester);
    } else if (schedules && schedules.length > 0) {
      const targetYear = options?.schoolYear || schoolYear || defaultSchoolYear;
      const foundSem = schedules.find((s) => !targetYear || s.schoolYear === targetYear)?.semester;
      if (foundSem) setSemester(foundSem);
    }
  }, [options?.semester, options?.schoolYear, schoolYear, defaultSchoolYear, schedules]);

  const activeSchoolYear = options?.schoolYear || schoolYear || defaultSchoolYear;
  const activeSemester =
    (options?.semester === 1 || options?.semester === 2 || options?.semester === 3)
      ? options.semester
      : semester || defaultSemester;

  const schoolYears = useMemo(
    () => [...new Set((schedules ?? []).map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a)),
    [schedules],
  );

  const visibleSchedules = useMemo(() => {
    if (!schedules || !activeSchoolYear) return [];
    return schedules
      .filter((s) => s.schoolYear === activeSchoolYear && s.semester === activeSemester)
      .sort(
        (a, b) =>
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
  }, [schedules, activeSchoolYear, activeSemester]);

  const isResolvingTerm = Boolean(schedules && schedules.length > 0 && !activeSchoolYear);
  const isLoading = schedules === null || isResolvingTerm;

  return {
    isLoading,
    loadError,
    schoolYear: activeSchoolYear,
    setSchoolYear,
    semester: activeSemester,
    setSemester,
    schoolYears,
    visibleSchedules,
    attestations: attestations ?? [],
    attestationsLoading: attestations === null,
  };
}
