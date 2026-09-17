import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { FieldChrome } from "~/components/ui/input";
import { InfoCircleIcon } from "~/components/ui/icons";
import { SearchInput } from "~/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { AvailabilityReviewDrawer } from "~/features/dean-availability/availability-review-drawer";
import { WidenRequestInbox } from "~/features/dean-availability/widen-request";
import { useAuth } from "~/hooks/use-auth";
import { useDebounce } from "~/hooks/use-debounce";
import { PageHeader } from "~/layouts/page-header";
import { deanAvailabilityService } from "~/services/dean-availability.service";
import type {
  AvailabilityWidenRequest,
  DepartmentAvailability,
  InstructorAvailabilityRow,
} from "~/types/dean-instructor-availability";

const STATE_TONE: Record<string, "gold" | "blue" | "emerald" | "slate"> = {
  awaiting_review: "gold",
  declaration_changed: "gold",
  accepted_as_declared: "emerald",
  configured: "blue",
  no_declaration: "slate",
};

export function DeanInstructorAvailabilityPage() {
  const { user } = useAuth();
  const readOnly = user?.role === "registrar";
  const { context, loading: termLoading, selectTerm } = useTermContext();

  const selectedSyId = context?.selection.syId;
  const selectedSemester = context?.selection.semesterNumber;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [stateFilter, setStateFilter] = useState("");
  const [data, setData] = useState<DepartmentAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<InstructorAvailabilityRow | null>(null);
  const [widenRequests, setWidenRequests] = useState<AvailabilityWidenRequest[]>([]);

  const load = useCallback(async () => {
    if (selectedSyId == null || selectedSemester == null) return;
    setLoading(true);
    setError(null);
    try {
      const [listing, widen] = await Promise.all([
        deanAvailabilityService.list(selectedSyId, selectedSemester, {
          search: debouncedSearch.trim() || undefined,
          state: stateFilter || undefined,
        }),
        deanAvailabilityService.listWidenRequests(selectedSyId, selectedSemester, "pending"),
      ]);
      setData(listing);
      setWidenRequests(widen.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load instructor availability.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedSemester, selectedSyId, stateFilter]);

  useEffect(() => {
    if (termLoading || selectedSyId == null || selectedSemester == null) return;
    load();
  }, [termLoading, load, selectedSemester, selectedSyId]);

  const rows = data?.instructors ?? [];
  const summary = data?.summary;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Instructor Availability"
        actions={
          context && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-40">
                <FieldChrome id="dean-avail-sy" label="School year">
                  <Select
                    items={context.schoolYears.map((sy) => ({ value: String(sy.id), label: sy.schoolYear }))}
                    value={selectedSyId ? String(selectedSyId) : ""}
                    onValueChange={(val) => {
                      if (val && selectedSemester) selectTerm(Number(val), selectedSemester);
                    }}
                  >
                    <SelectTrigger id="dean-avail-sy">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {context.schoolYears.map((sy) => (
                        <SelectItem key={sy.id} value={String(sy.id)}>
                          {sy.schoolYear}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
              </div>
              <div className="w-40">
                <FieldChrome id="dean-avail-sem" label="Semester">
                  <Select
                    items={context.semesters.map((sem) => ({
                      value: String(sem.semesterNumber),
                      label: sem.label,
                    }))}
                    value={selectedSemester ? String(selectedSemester) : ""}
                    onValueChange={(val) => {
                      if (val && selectedSyId) selectTerm(selectedSyId, Number(val));
                    }}
                  >
                    <SelectTrigger id="dean-avail-sem">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {context.semesters.map((sem) => (
                        <SelectItem key={sem.semesterNumber} value={String(sem.semesterNumber)}>
                          {sem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
              </div>
            </div>
          )
        }
      />

      <div className="mt-6 flex flex-col gap-6">
        <Card className="flex items-start gap-3 border-sky-300 bg-sky-50/70 p-4 dark:border-sky-400/30 dark:bg-sky-400/10">
          <span className="mt-0.5 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true">
            <InfoCircleIcon size={18} />
          </span>
          <div className="font-body text-sm text-sky-950 dark:text-sky-100">
            <p className="font-medium">Scheduling constraint policy</p>
            <p className="mt-1 leading-relaxed">
              {readOnly
                ? "Instructor availability windows are configured by academic deans for their respective departments. As registrar, you can review availability college-wide and request deans to widen hours when schedule conflicts arise."
                : "Instructor declarations are voluntary requests. Hard availability constraints are only applied when configured by the dean here. Instructors without configured restrictions can be scheduled at any regular teaching hour."}
            </p>
          </div>
        </Card>

        <WidenRequestInbox
          requests={widenRequests}
          readOnly={readOnly}
          onDecided={load}
        />

        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Awaiting Review
              </p>
              <p className="mt-1 font-display text-2xl tracking-wide text-amber-600 dark:text-gold-300">
                {summary.awaitingReview}
              </p>
            </Card>
            <Card className="p-4">
              <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Configured
              </p>
              <p className="mt-1 font-display text-2xl tracking-wide text-navy-800 dark:text-mist-100">
                {summary.configured}
              </p>
            </Card>
            <Card className="p-4">
              <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Unrestricted
              </p>
              <p className="mt-1 font-display text-2xl tracking-wide text-slate-600 dark:text-slate-300">
                {summary.unconstrained}
              </p>
            </Card>
            <Card className="p-4">
              <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Load Shortfall
              </p>
              <p className="mt-1 font-display text-2xl tracking-wide text-rose-600 dark:text-rose-400">
                {summary.withShortfall}
              </p>
            </Card>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <SearchInput
              id="dean-avail-search"
              placeholder="Search instructor or ID…"
              value={search}
              onChange={setSearch}
            />
          </div>

          <div className="w-full sm:w-64">
            <FieldChrome id="dean-avail-filter-state" label="Review status">
              <Select
                items={[
                  { value: "all", label: "All instructors" },
                  ...Object.entries(data?.reviewStates ?? {}).map(([val, lbl]) => ({
                    value: val,
                    label: lbl,
                  })),
                ]}
                value={stateFilter || "all"}
                onValueChange={(val) => setStateFilter(val === "all" ? "" : (val as string))}
              >
                <SelectTrigger id="dean-avail-filter-state">
                  <SelectValue placeholder="All instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All instructors</SelectItem>
                  {Object.entries(data?.reviewStates ?? {}).map(([val, lbl]) => (
                    <SelectItem key={val} value={val}>
                      {lbl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </div>
        </div>

        {loading && data === null ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : error ? (
          <EmptyState title="Unable to load availability">{error}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState title="No instructors found">
            {search || stateFilter
              ? "No instructors match your current search or status filter."
              : "No instructor records found for this academic term."}
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((row) => {
              const tone = STATE_TONE[row.reviewState] ?? "slate";
              const label = data?.reviewStates[row.reviewState] ?? row.reviewState;
              const isShort = (row.load.shortfallHours ?? 0) > 0;

              return (
                <Card
                  key={row.instructorProfileId}
                  className="flex flex-col justify-between p-5 transition-shadow hover:shadow-md dark:border-white/10 dark:bg-surface-raised"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                            {row.name}
                          </h3>
                          {row.departmentAbbrev && (
                            <Badge tone="slate">{row.departmentAbbrev}</Badge>
                          )}
                        </div>
                        <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                          {[row.employmentStatus, row.academicRank].filter(Boolean).join(" · ")}
                        </p>
                      </div>

                      <Badge tone={tone}>{label}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-white/2">
                      <div>
                        <span className="font-body font-medium text-slate-500 dark:text-slate-400">
                          Assigned Load:
                        </span>
                        <p className="mt-0.5 font-body font-semibold text-navy-800 dark:text-mist-100">
                          {row.load.assignedWeeklyHours} hrs ({row.load.assignedSubjects} subjects)
                        </p>
                      </div>

                      <div>
                        <span className="font-body font-medium text-slate-500 dark:text-slate-400">
                          Configured Hours:
                        </span>
                        <p className="mt-0.5 font-body font-semibold text-navy-800 dark:text-mist-100">
                          {row.configuration.configured
                            ? `${row.configuration.windows.length} time ranges`
                            : "Unrestricted"}
                        </p>
                      </div>
                    </div>

                    {isShort && (
                      <p className="font-body text-xs text-rose-600 dark:text-rose-400">
                        Available hours are less than assigned weekly load.
                      </p>
                    )}

                    {row.declaration.declared && (
                      <div className="border-t border-slate-100 pt-2 text-xs dark:border-white/5">
                        <span className="font-body text-slate-500 dark:text-slate-400">
                          Instructor declared: {row.declaration.windows.length} time ranges
                        </span>
                        {row.declaration.note && (
                          <p className="mt-0.5 truncate italic text-slate-600 dark:text-slate-300">
                            &ldquo;{row.declaration.note}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                    <Button
                      variant={readOnly ? "outline" : "primary"}
                      onClick={() => setReviewing(row)}
                      className="w-full text-xs py-2"
                    >
                      {readOnly ? "View availability" : "Review & configure"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedSyId != null && selectedSemester != null && (
        <AvailabilityReviewDrawer
          row={reviewing}
          syId={selectedSyId}
          semesterNumber={selectedSemester}
          termClosed={false}
          readOnly={readOnly}
          onSaved={load}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  );
}
