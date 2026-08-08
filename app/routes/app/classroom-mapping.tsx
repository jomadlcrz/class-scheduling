import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { MappingSkeleton } from "~/components/ui/skeleton";
import { ResultState } from "~/components/feedback/result-state";
import { MappingGridView } from "~/features/classroom-mapping/mapping-grid-view";
import { MappingLegend } from "~/features/classroom-mapping/mapping-legend";
import { filterClassrooms } from "~/features/classroom-mapping/mapping-model";
import { MappingTableView } from "~/features/classroom-mapping/mapping-table-view";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { buildingService } from "~/services/building.service";
import { classroomMappingService } from "~/services/classroom-mapping.service";
import { schoolYearService } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import type { Building } from "~/types/building";
import type { Classroom } from "~/features/classroom-mapping/mapping-model";
import type { Semester } from "~/types/semester";

export function meta() {
  return [
    { title: "Classroom Mapping — GWC Class Scheduling" },
    { name: "description", content: "Weekly schedule and availability for all classrooms." },
  ];
}

export default function ClassroomMappingRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <ClassroomMappingPage />
    </RoleGuard>
  );
}

function ClassroomMappingPage() {
  const [schoolYear, setSchoolYear] = useState("");
  const [semesterNumber, setSemesterNumber] = useState<number | null>(null);
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [rawSearch, setRawSearch] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  const { data: semestersData } = useCachedData("semesters", () => semesterService.list());
  const { data: schoolYearsData } = useCachedData("school-years", () => schoolYearService.list());
  const { data: buildingsData } = useCachedData("buildings", () => buildingService.list());
  const semesters = useMemo(() => semestersData ?? [], [semestersData]);
  const schoolYears = useMemo(
    () => (schoolYearsData ?? []).map((o) => o.schoolYear),
    [schoolYearsData],
  );
  const buildings = buildingsData ?? [];
  const contextLoading = semestersData === null || schoolYearsData === null;
  const buildingName = buildings.find((b) => String(b.id) === buildingFilter)?.name;

  // Default the term selectors to the first available option once loaded.
  useEffect(() => {
    if (semesters.length > 0 && semesterNumber === null) setSemesterNumber(semesters[0].semesterNumber);
  }, [semesters, semesterNumber]);
  useEffect(() => {
    if (schoolYears.length > 0 && !schoolYear) setSchoolYear(schoolYears[0]);
  }, [schoolYears, schoolYear]);

  // Term + building scoped; cached per combination so revisits skip the skeleton.
  const mappingKey = `classroom-mapping:${schoolYear}:${semesterNumber ?? "none"}:${buildingName ?? "all"}`;
  const { data: classrooms, error: loadError } = useCachedData(
    mappingKey,
    () =>
      classroomMappingService
        .list({ schoolYear, semesterNumber: semesterNumber as number, building: buildingName })
        .then((result) => result.classrooms),
    { enabled: schoolYear !== "" && semesterNumber !== null },
  );

  const search = useDeferredValue(rawSearch);

  const filtered = useMemo(
    () => {
      if (!classrooms) return [];
      return filterClassrooms(classrooms, search);
    },
    [classrooms, search],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Classroom Mapping"
        description="Weekly schedule and availability for all classrooms by room."
      />

      <div className="mt-4 flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
          <div className="grid grid-cols-3 gap-3 md:flex md:flex-wrap">
            <div className="md:w-44">
              <Select
                items={
                  contextLoading
                    ? [{ value: "", label: "Loading…" }]
                    : schoolYears.length === 0
                      ? [{ value: "", label: "No school year" }]
                      : schoolYears.map((y) => ({ value: y, label: y }))
                }
                value={schoolYear}
                onValueChange={(v) => setSchoolYear(v as string)}
              >
                <SelectTrigger id="cm-year" aria-label="School Year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contextLoading ? (
                    <SelectItem value="">Loading…</SelectItem>
                  ) : schoolYears.length === 0 ? (
                    <SelectItem value="">No school year</SelectItem>
                  ) : (
                    schoolYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="md:w-44">
              <Select
                items={
                  contextLoading
                    ? [{ value: "", label: "Loading…" }]
                    : semesters.length === 0
                      ? [{ value: "", label: "No semester" }]
                      : semesters.map((s) => ({
                          value: String(s.semesterNumber),
                          label: s.displayName ?? s.semester,
                        }))
                }
                value={semesterNumber != null ? String(semesterNumber) : ""}
                onValueChange={(v) => setSemesterNumber(v ? Number(v) : null)}
              >
                <SelectTrigger id="cm-sem" aria-label="Semester">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contextLoading ? (
                    <SelectItem value="">Loading…</SelectItem>
                  ) : semesters.length === 0 ? (
                    <SelectItem value="">No semester</SelectItem>
                  ) : (
                    semesters.map((s) => (
                      <SelectItem key={s.id} value={String(s.semesterNumber)}>
                        {s.displayName ?? s.semester}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="md:w-44">
              <Select
                items={[
                  { value: "all", label: "All buildings" },
                  ...buildings.map((b) => ({ value: String(b.id), label: b.name })),
                ]}
                value={buildingFilter}
                onValueChange={(v) => setBuildingFilter(v as string)}
              >
                <SelectTrigger id="cm-building" aria-label="Building">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All buildings</SelectItem>
                  {buildings.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative w-full md:self-end">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={rawSearch}
              onChange={e => setRawSearch(e.target.value)}
              placeholder="Search classrooms…"
              aria-label="Search classrooms"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
        </div>

        <MappingLegend />

        <div className="flex justify-end">
          <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        {loadError && classrooms === null ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : !contextLoading && schoolYears.length === 0 ? (
          <EmptyState title="No school year">
            No school year has been added yet.
          </EmptyState>
        ) : !contextLoading && semesters.length === 0 ? (
          <EmptyState title="No semester">
            No semester has been configured yet.
          </EmptyState>
        ) : classrooms === null ? (
          <MappingSkeleton rooms={4} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No classrooms found">
            No classrooms match the current filters.
          </EmptyState>
        ) : viewMode === "grid" ? (
          <MappingGridView classrooms={filtered} />
        ) : (
          <MappingTableView classrooms={filtered} />
        )}
      </div>
    </div>
  );
}
