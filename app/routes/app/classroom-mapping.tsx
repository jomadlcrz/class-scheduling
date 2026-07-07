import { useCallback, useEffect, useMemo, useState, useDeferredValue } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/ui/empty-state";
import { GridIcon, ListIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { MappingGridView } from "~/features/classroom-mapping/mapping-grid-view";
import { MappingLegend } from "~/features/classroom-mapping/mapping-legend";
import { filterClassrooms } from "~/features/classroom-mapping/mapping-model";
import { MappingTableView } from "~/features/classroom-mapping/mapping-table-view";
import { ScheduleViewToggle } from "~/features/schedules/schedule-view-toggle";
import { PageHeader } from "~/layouts/page-header";
import { buildingService } from "~/services/building.service";
import { classroomMappingService } from "~/services/classroom-mapping.service";
import type { Building } from "~/types/building";
import type { Classroom } from "~/features/classroom-mapping/mapping-model";

export function meta() {
  return [
    { title: "Classroom Mapping — GWC Class Scheduling" },
    { name: "description", content: "Weekly schedule and availability for all classrooms." },
  ];
}

const SEMESTER_OPTIONS = ["1st Semester", "2nd Semester", "Summer"];

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
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState(SEMESTER_OPTIONS[0]);
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [rawSearch, setRawSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setClassrooms(null);
    try {
      const [result, buildingList] = await Promise.all([
        classroomMappingService.list({
          schoolYear: schoolYear || undefined,
          semester: semester || undefined,
        }),
        buildingService.list(),
      ]);
      setClassrooms(result.classrooms);
      setSchoolYears(result.schoolYears);
      if (!schoolYear && result.schoolYears.length > 0) {
        setSchoolYear(result.schoolYears[0]);
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
              {schoolYears.length === 0 && <option value="">School year</option>}
              {schoolYears.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select label="Semester" id="cm-sem" hideLabel value={semester} onChange={e => setSemester(e.target.value)}>
              {SEMESTER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Building" id="cm-building" hideLabel value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)}>
              <option value="all">All buildings</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex justify-center md:hidden">
          <MappingLegend />
        </div>

        <div className="flex items-center justify-end gap-3 md:hidden">
          <ScheduleViewToggle
            value={viewMode}
            onChange={setViewMode}
            ariaLabel="Classroom view"
            options={[
              { mode: "grid", title: "Grid view", Icon: GridIcon },
              { mode: "list", title: "List view", Icon: ListIcon },
            ]}
          />
        </div>

        <div className="hidden grid-cols-[1fr_auto_1fr] items-center gap-3 md:grid">
          <div />
          <MappingLegend />
          <div className="flex justify-end">
            <ScheduleViewToggle
              value={viewMode}
              onChange={setViewMode}
              ariaLabel="Classroom view"
              options={[
                { mode: "grid", title: "Grid view", Icon: GridIcon },
                { mode: "list", title: "List view", Icon: ListIcon },
              ]}
            />
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-red-300 py-16 text-center dark:border-red-800">
          <p className="font-body text-sm text-red-600 dark:text-red-400">{loadError}</p>
          <button type="button" onClick={load} className="cursor-pointer font-body text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            Try again
          </button>
        </div>
      ) : classrooms === null ? (
        <div role="status" aria-label="Loading classroom mapping" className="grid place-items-center py-12 text-navy-700 dark:text-slate-200">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-white/10">
          <span className="text-slate-400 dark:text-slate-600">
            <SearchIcon size={32} />
          </span>
          <EmptyState title={rawSearch ? "No classrooms found" : "No classrooms available"}>
            {rawSearch ? (
              <>No classrooms match "<span className="font-medium text-gray-700 dark:text-slate-300">{rawSearch}</span>". Try a different name.</>
            ) : (
              "No classroom mapping data is available for the current filters."
            )}
          </EmptyState>
        </div>
      ) : viewMode === "list" ? (
        <div className="mt-3">
          <MappingTableView classrooms={filtered} />
        </div>
      ) : (
          <div className="mt-3">
            <MappingGridView classrooms={filtered} />
          </div>
      )}
    </div>
  );
}


