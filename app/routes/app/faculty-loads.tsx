import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Pagination } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import {
  FacultyLoadTable,
  toExistingFacultyLoadRow,
} from "~/features/faculty/faculty-load-table";
import { FacultyLoadSubjectsModal } from "~/features/faculty/faculty-load-subjects-modal";
import { Modal } from "~/components/ui/modal";
import { usePagination } from "~/hooks/use-pagination";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { facultyLoadService } from "~/services/faculty-load.service";
import type { FacultyLoadingEntry } from "~/types/faculty-load";
import type { FacultyLoadRow } from "~/features/faculty/faculty-load-table";

export function meta() {
  return [
    { title: "Faculty Loads — GWC Class Scheduling" },
    { name: "description", content: "View faculty subject assignments for a school year and semester." },
  ];
}

export default function FacultyLoadsRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <FacultyLoadsPage />
    </RoleGuard>
  );
}

function FacultyLoadsPage() {
  const { schoolYears, defaultSchoolYear } = useSchoolYears();
  const { semesters, semesterLabel } = useSemesters();

  const [schoolYearId, setSchoolYearId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const [loadError, setLoadError] = useState<string | null>(null);

  const [existingLoads, setExistingLoads] = useState<FacultyLoadingEntry[] | null>(null);
  const [termError, setTermError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewTarget, setViewTarget] = useState<FacultyLoadRow | null>(null);

  useEffect(() => {
    if (schoolYearId || schoolYears.length === 0) return;
    const match = schoolYears.find((s) => s.schoolYear === defaultSchoolYear) ?? schoolYears[0];
    if (match) setSchoolYearId(String(match.id));
  }, [schoolYears, defaultSchoolYear, schoolYearId]);

  useEffect(() => {
    if (semesterId || semesters.length === 0) return;
    const first = semesters.find((s) => s.semesterNumber !== 3) ?? semesters[0];
    if (first) setSemesterId(String(first.id));
  }, [semesters, semesterId]);

  const matchedSy = schoolYears.find((s) => String(s.id) === schoolYearId);
  const matchedSem = semesters.find((s) => String(s.id) === semesterId);

  useEffect(() => {
    if (!matchedSy || !matchedSem) return;
    let cancelled = false;
    setExistingLoads(null);
    setTermError(null);
    facultyLoadService
      .getFacultyLoading(matchedSy.id, matchedSem.id)
      .then((data) => {
        if (!cancelled) setExistingLoads(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setTermError(err instanceof Error ? err.message : "Unable to load existing faculty loads.");
        setExistingLoads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [matchedSy?.id, matchedSem?.id]);

  const termLoads = existingLoads ?? [];

  const visibleTermLoads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return termLoads;
    return termLoads.filter((entry) => entry.instructorName.toLowerCase().includes(query));
  }, [termLoads, search]);

  const pagination = usePagination(
    visibleTermLoads,
    `${matchedSy?.id ?? ""}|${matchedSem?.id ?? ""}|${search}`,
  );

  const contextReady = Boolean(matchedSy && matchedSem);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Faculty Loads"
        description="View faculty subject assignments for a school year and semester."
      />

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Select
              items={schoolYears.map((s) => ({ value: String(s.id), label: s.schoolYear }))}
              value={schoolYearId}
              onValueChange={(v) => setSchoolYearId(v as string)}
            >
              <SelectTrigger id="fl-school-year" aria-label="School Year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.schoolYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select
              items={semesters
                .filter((s) => s.semesterNumber !== 3)
                .map((s) => ({ value: String(s.id), label: semesterLabel(s.semesterNumber) }))}
              value={semesterId}
              onValueChange={(v) => setSemesterId(v as string)}
            >
              <SelectTrigger id="fl-semester" aria-label="Semester">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {semesters
                  .filter((s) => s.semesterNumber !== 3)
                  .map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {semesterLabel(s.semesterNumber)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative order-first w-full sm:order-0 sm:ml-auto sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="faculty-load-search"
              type="search"
              placeholder="Faculty name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
        </div>

        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : (
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
              Faculty Loads
            </h2>
            {!contextReady ? (
              <EmptyState title="Select a term">
                Pick a school year and semester to see faculty loads.
              </EmptyState>
            ) : existingLoads === null ? (
              <div
                role="status"
                aria-label="Loading faculty loads"
                className="grid place-items-center py-8 text-navy-700 dark:text-slate-200"
              >
                <Spinner />
              </div>
            ) : termError ? (
              <ResultState tone="error" title="Unable to load">
                {termError}
              </ResultState>
            ) : termLoads.length === 0 ? (
              <EmptyState title="No faculty loads yet">
                No faculty have been assigned subjects for this term yet.
              </EmptyState>
            ) : visibleTermLoads.length === 0 ? (
              <EmptyState title="No faculty found">
                No faculty match "{search}". Try a different search.
              </EmptyState>
            ) : (
              <>
                <FacultyLoadTable
                  rows={pagination.pageItems.map(toExistingFacultyLoadRow)}
                  onViewSubjects={setViewTarget}
                />
                <Pagination
                  page={pagination.page}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                />
              </>
            )}
          </section>
        )}
      </div>

      <Modal
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title={viewTarget ? `Subjects — ${viewTarget.fullName}` : "Subjects"}
      >
        {viewTarget && <FacultyLoadSubjectsModal row={viewTarget} />}
      </Modal>
    </div>
  );
}
