import { useCallback, useEffect, useMemo, useState, useDeferredValue } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/ui/empty-state";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ResultState } from "~/components/feedback/result-state";
import { MappingGridView } from "~/features/classroom-mapping/mapping-grid-view";
import { MappingLegend } from "~/features/classroom-mapping/mapping-legend";
import { filterClassrooms } from "~/features/classroom-mapping/mapping-model";
import { MappingTableView } from "~/features/classroom-mapping/mapping-table-view";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
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
  const [classrooms, setClassrooms] = useState<Classroom[] | null>(null);
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [rawSearch, setRawSearch] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("grid");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    semesterService
      .list()
      .then((list) => {
        setSemesters(list);
        if (list.length > 0 && !semester) setSemester(list[0].semester);
      })
      .catch(() => setSemesters([]));
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [result, buildingList, syOptions] = await Promise.all([
        classroomMappingService.list({
          schoolYear: schoolYear || undefined,
          semester: semester || undefined,
        }),
        buildingService.list(),
        schoolYearService.list(),
      ]);
      setClassrooms(result.classrooms);
      setSchoolYears(syOptions.map((o) => o.schoolYear));
      if (!schoolYear && syOptions.length > 0) {
        setSchoolYear(syOptions[0].schoolYear);
      }
      setBuildings(buildingList);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load classroom mapping.");
    }
  }, [schoolYear, semester]);

  useEffect(() => {
    void load();
  }, [load]);

  const search = useDeferredValue(rawSearch);

  const filtered = useMemo(
    () => {
      if (!classrooms) return [];
      let result = classrooms;
      if (buildingFilter !== "all") {
        result = result.filter((r) => r.buildingId === buildingFilter);
      }
      return filterClassrooms(result, search);
    },
    [classrooms, search, buildingFilter],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Classroom Mapping"
        description="Weekly schedule and availability for all classrooms by room."
      />

      <div className="mt-4 flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
          <div className="grid grid-cols-3 gap-3">
            <Select label="School Year" id="cm-year" hideLabel value={schoolYear} onChange={e => setSchoolYear(e.target.value)}>
              {schoolYears.length === 0 && <option value="">No school years</option>}
              {schoolYears.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select label="Semester" id="cm-sem" hideLabel value={semester} onChange={e => setSemester(e.target.value)}>
              {semesters.map(s => <option key={s.id} value={s.semester}>{s.semester}</option>)}
            </Select>
            <Select label="Building" id="cm-building" hideLabel value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)}>
              <option value="all">All buildings</option>
              {buildings.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </Select>
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

        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : classrooms === null ? (
          <div
            role="status"
            aria-label="Loading classroom mapping"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
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
