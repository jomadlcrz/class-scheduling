import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { GridIcon, ListIcon } from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { Pagination } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { IrregularClassCards } from "~/features/schedules/irregular-class-cards";
import { IrregularClassTable } from "~/features/schedules/irregular-class-table";
import { ScheduleViewToggle } from "~/features/schedules/schedule-view-toggle";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { irregularClassService, type IrregularStudent } from "~/services/irregular-class.service";

export function meta() {
  return [
    { title: "Irregular Class — GWC Class Scheduling" },
    { name: "description", content: "Manage irregular class schedules for the current academic term." },
  ];
}

export default function IrregularClassRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <IrregularClassPage />
    </RoleGuard>
  );
}

type ViewMode = "table" | "cards";

const VIEW_OPTIONS = [
  { mode: "table", title: "List view", Icon: ListIcon },
  { mode: "cards", title: "Card view", Icon: GridIcon },
] as const;

function IrregularClassPage() {
  const [students, setStudents] = useState<IrregularStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    irregularClassService
      .listStudents()
      .then(setStudents)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
      );
  }, []);

  const programs = useMemo(
    () => [...new Set((students ?? []).map((s) => s.programTaken))].sort(),
    [students],
  );

  const visibleStudents = useMemo(() => {
    if (!students) return [];
    const query = search.trim().toLowerCase();
    return students.filter((s) => {
      if (programFilter !== "all" && s.programTaken !== programFilter) return false;
      if (
        query &&
        !s.studentId.toLowerCase().includes(query) &&
        !s.studentName.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [students, search, programFilter]);

  const pagination = usePagination(visibleStudents, `${search}|${programFilter}`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Irregular Class"
        description="Irregular class schedules for the current academic term."
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id="irregular-search"
            label="Search"
            type="search"
            placeholder="Name or student ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FieldChrome id="irregular-program-filter" label="Program">
            <Select
              items={[
                { value: "all", label: "All programs" },
                ...programs.map((p) => ({ value: p, label: p })),
              ]}
              value={programFilter}
              onValueChange={(v) => setProgramFilter(v as string)}
            >
              <SelectTrigger id="irregular-program-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
        </div>

        <div className="flex justify-end">
          <ScheduleViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={VIEW_OPTIONS}
            ariaLabel="Irregular class view"
          />
        </div>

        {error ? (
          <EmptyState title="Couldn't load irregular students">{error}</EmptyState>
        ) : students === null ? (
          <div
            role="status"
            aria-label="Loading irregular students"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : students.length === 0 ? (
          <EmptyState title="No irregular students">
            No students are currently flagged as irregular.
          </EmptyState>
        ) : visibleStudents.length === 0 ? (
          <EmptyState title="No students found">
            No irregular students match the current filters.
          </EmptyState>
        ) : (
          <>
            {viewMode === "table" ? (
              <IrregularClassTable students={pagination.pageItems} />
            ) : (
              <IrregularClassCards students={pagination.pageItems} />
            )}
            <Pagination
              page={pagination.page}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
