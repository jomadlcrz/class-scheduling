import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { FieldChrome } from "~/components/ui/input";
import { SearchInput } from "~/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { MySubjectCard } from "~/features/faculty/my-subject-card";
import { useNotificationStream } from "~/features/notifications/use-notification-stream";
import {
  WorkflowSummaryStats,
  type WorkflowSummaryStat,
} from "~/features/schedules/workflow-summary-stats";
import { useDebounce } from "~/hooks/use-debounce";
import { PageHeader } from "~/layouts/page-header";
import {
  selfAnalyticsService,
  type InstructorSubjectStatus,
} from "~/services/self-analytics.service";
import type {
  InstructorAssignedSubject,
  InstructorTeachingLoad,
} from "~/types/instructor-load";
import type { NotificationType } from "~/types/notification";

type Filter = InstructorSubjectStatus;

const LOAD_CHANGING_TYPES: NotificationType[] = [
  "subject_assignment_changed",
  "subject_offering_updated",
  "schedule_published",
  "schedule_rescheduled",
  "suggestion_resolution_granted",
];

export function MySubjectsPage() {
  const { context, loading: termLoading, selectTerm } = useTermContext();
  const selectedSyId = context?.selection.syId;
  const selectedSemester = context?.selection.semesterNumber;

  const [load, setLoad] = useState<InstructorTeachingLoad | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<InstructorAssignedSubject[] | null>(null);
  const [searching, setSearching] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchLoad = useCallback(
    async (options?: { quiet?: boolean }) => {
      if (selectedSyId == null || selectedSemester == null) return;
      if (!options?.quiet) {
        setLoading(true);
        setError(null);
      }
      try {
        const result = await selfAnalyticsService.getFacultyLoad(selectedSyId, selectedSemester);
        setLoad(result);
      } catch (err) {
        if (!options?.quiet) {
          setLoad(null);
          setError(err instanceof Error ? err.message : "Could not load your assigned subjects.");
        }
      } finally {
        if (!options?.quiet) setLoading(false);
      }
    },
    [selectedSemester, selectedSyId],
  );

  useEffect(() => {
    if (termLoading || selectedSyId == null || selectedSemester == null) {
      setLoad(null);
      return;
    }
    fetchLoad();
  }, [termLoading, fetchLoad, selectedSemester, selectedSyId]);

  useNotificationStream({
    onNotification: (notification) => {
      if (LOAD_CHANGING_TYPES.includes(notification.type)) fetchLoad({ quiet: true });
    },
    onReconnected: () => fetchLoad({ quiet: true }),
  });

  useEffect(() => {
    if (selectedSyId == null || selectedSemester == null) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    let active = true;
    setSearching(true);
    selfAnalyticsService
      .searchFacultySubjects(selectedSyId, selectedSemester, debouncedSearch.trim(), filter)
      .then((rows) => {
        if (active) setSearchResults(rows);
      })
      .catch(() => {
        if (active) setSearchResults([]);
      })
      .finally(() => {
        if (active) setSearching(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, filter, selectedSemester, selectedSyId]);

  const subjects = load?.subjects ?? [];
  const scheduledCount = useMemo(
    () => subjects.filter((s) => s.sessions.length > 0).length,
    [subjects],
  );
  const awaitingCount = subjects.length - scheduledCount;
  const visibleSubjects = searchResults ?? subjects;
  const summary = load?.summary;

  const stats: WorkflowSummaryStat[] = summary
    ? [
        {
          key: "assigned",
          label: "Assigned subjects",
          value: subjects.length,
          tone: "blue",
          muted: subjects.length === 0,
          onClick: () => setFilter("all"),
          active: filter === "all",
        },
        {
          key: "scheduled",
          label: "Scheduled",
          value: scheduledCount,
          hint: "Placed on the schedule",
          tone: "emerald",
          muted: scheduledCount === 0,
          onClick: () => setFilter("scheduled"),
          active: filter === "scheduled",
        },
        {
          key: "awaiting",
          label: "Awaiting schedule",
          value: awaitingCount,
          tone: "amber",
          muted: awaitingCount === 0,
          onClick: () => setFilter("awaiting"),
          active: filter === "awaiting",
        },
        {
          key: "units",
          label: "Total units",
          value: summary.units,
          tone: "violet",
          muted: summary.units === 0,
        },
        {
          key: "hours",
          label: "Weekly hours",
          value: `${summary.bookedHours} / ${summary.maxWeeklyHours}`,
          hint: summary.bookedHours > summary.maxWeeklyHours ? "Overload assigned" : "Regular teaching load",
          tone: summary.bookedHours > summary.maxWeeklyHours ? "rose" : "slate",
        },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="My Subjects"
        actions={
          context && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-40">
                <FieldChrome id="subj-sy" label="School year">
                  <Select
                    items={context.schoolYears.map((sy) => ({ value: String(sy.id), label: sy.schoolYear }))}
                    value={selectedSyId ? String(selectedSyId) : ""}
                    onValueChange={(val) => {
                      if (val && selectedSemester) selectTerm(Number(val), selectedSemester);
                    }}
                  >
                    <SelectTrigger id="subj-sy">
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
                <FieldChrome id="subj-sem" label="Semester">
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
                    <SelectTrigger id="subj-sem">
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

      {termLoading || loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <div className="mt-6">
          <EmptyState title="Unable to load subjects">{error}</EmptyState>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {stats.length > 0 && <WorkflowSummaryStats stats={stats} />}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <SearchInput
                id="my-subjects-search"
                placeholder="Search subject code or title…"
                value={search}
                onChange={setSearch}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-surface-raised">
              {(
                [
                  { id: "all", label: "All Subjects" },
                  { id: "scheduled", label: "Scheduled" },
                  { id: "awaiting", label: "Awaiting Schedule" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`cursor-pointer rounded-md px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                    filter === tab.id
                      ? "bg-navy-700 text-white dark:bg-gold-400 dark:text-navy-950"
                      : "text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-mist-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {searching ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : visibleSubjects.length === 0 ? (
            <EmptyState title="No subjects found">
              {search
                ? `No assigned subjects match "${search}".`
                : filter === "scheduled"
                  ? "No scheduled subjects for this term yet."
                  : filter === "awaiting"
                    ? "No subjects awaiting scheduling."
                    : "No subjects have been assigned to your load for this term."}
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleSubjects.map((subject) => (
                <MySubjectCard key={subject.subjectId} subject={subject} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
