import { useMemo, useState } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ChevronDownIcon, ChevronRightIcon, LockIcon } from "~/components/ui/icons";
import { SearchInput } from "~/components/ui/search-input";
import type {
  AdjustmentSet,
  AdjustmentSetStatus,
  AdjustmentUnplacedSubject,
} from "~/types/schedule-adjustment";

/**
 * What generation could not fit, per section.
 *
 * This panel is the reason the board exists. A set that came back short is
 * reported everywhere else as the single word "Incomplete", which names the
 * state without naming the work: the Registrar still has to find out WHICH
 * subject is missing and how many of its meetings. These rows are a compact
 * overview; placement starts by selecting a free range on the timetable.
 */

const STATUS_STYLES: Record<
  AdjustmentSetStatus,
  { label: string; tone: BadgeTone }
> = {
  ready: {
    label: "Complete",
    tone: "emerald",
  },
  incomplete: {
    label: "Incomplete",
    tone: "gold",
  },
  unscheduled: {
    label: "Not scheduled",
    tone: "slate",
  },
};

type QueueFilter = "all" | "incomplete" | "unscheduled" | "ready";

const QUEUE_FILTERS: { value: QueueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "incomplete", label: "Incomplete" },
  { value: "unscheduled", label: "Unscheduled" },
  { value: "ready", label: "Ready to save" },
];

export type PlacementDraft = {
  /** Client-side id — these are staged, not saved, until the section's save. */
  draftId: string;
  setId: number;
  programId: number;
  subjectId: number;
  subjectCode: string;
  subjectType: string;
  sessionMode: "LEC" | "LAB";
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: number | null;
  roomName: string | null;
  classMode: string;
  instructorId: number | null;
  instructorName: string;
};

type Props = {
  sets: AdjustmentSet[];
  /** Staged placements, so a subject already drafted stops counting as owed. */
  drafts: PlacementDraft[];
  onSaveSet: (set: AdjustmentSet) => void;
  onDiscardSetDrafts: (setId: number) => void;
  savingSetId: number | null;
  searchId: string;
};

/** Meetings still owed for a subject once staged drafts are counted. */
export function remainingAfterDrafts(
  set: AdjustmentSet,
  subject: AdjustmentUnplacedSubject,
  drafts: PlacementDraft[],
): number {
  const staged = drafts.filter(
    (draft) => draft.setId === set.setId && draft.subjectId === subject.subjectId,
  ).length;
  return Math.max(0, subject.remaining - staged);
}

/** A set is savable only once nothing is owed — the backend refuses a partial save. */
export function setIsComplete(set: AdjustmentSet, drafts: PlacementDraft[]): boolean {
  return set.unplaced.every((subject) => remainingAfterDrafts(set, subject, drafts) === 0);
}

export function AdjustmentUnplacedPanel({
  sets,
  drafts,
  onSaveSet,
  onDiscardSetDrafts,
  savingSetId,
  searchId,
}: Props) {
  const needingWork = sets.filter((set) => set.unplaced.length > 0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [expandedSetId, setExpandedSetId] = useState<number | null>(null);

  const queueRows = useMemo(
    () =>
      needingWork.map((set) => {
        const setDrafts = drafts.filter((draft) => draft.setId === set.setId);
        const complete = setDrafts.length > 0 && setIsComplete(set, setDrafts);
        const remaining = set.unplaced.reduce(
          (sum, subject) => sum + remainingAfterDrafts(set, subject, setDrafts),
          0,
        );
        const placed = Math.min(set.sessionCount, set.placedMeetings + setDrafts.length);
        return { set, setDrafts, complete, remaining, placed };
      }),
    [needingWork, drafts],
  );

  const counts = useMemo(
    () => ({
      all: queueRows.length,
      incomplete: queueRows.filter(({ set, complete }) => !complete && set.status === "incomplete").length,
      unscheduled: queueRows.filter(({ set, complete }) => !complete && set.status === "unscheduled").length,
      ready: queueRows.filter(({ complete }) => complete).length,
    }),
    [queueRows],
  );

  const groupedRows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const visible = queueRows
      .filter(({ set, complete }) => {
        if (filter === "ready") return complete;
        if (filter === "all") return true;
        return !complete && set.status === filter;
      })
      .filter(({ set }) => {
        if (!needle) return true;
        return [
          set.departmentAbbrev,
          set.programAbbrev,
          set.setName,
          set.setCode,
          ...set.unplaced.flatMap((subject) => [subject.subjectCode, subject.subjectTitle]),
        ].some((value) => value?.toLocaleLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const aPriority = a.complete ? 0 : a.setDrafts.length > 0 ? 1 : 2;
        const bPriority = b.complete ? 0 : b.setDrafts.length > 0 ? 1 : 2;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return (a.set.setName ?? a.set.setCode).localeCompare(b.set.setName ?? b.set.setCode);
      });

    const groups = new Map<string, typeof visible>();
    for (const row of visible) {
      const key = `${row.set.departmentAbbrev ?? "Other"} · ${row.set.programAbbrev ?? "Program"}`;
      const group = groups.get(key) ?? [];
      group.push(row);
      groups.set(key, group);
    }
    return [...groups.entries()];
  }, [filter, query, queueRows]);

  if (needingWork.length === 0) {
    return (
      <EmptyState title="All classes scheduled">
        Every section currently in view has its full curriculum scheduled on the timetable.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search and filter controls */}
      <div className="flex flex-col gap-3">
        <SearchInput
          id={searchId}
          value={query}
          onChange={setQuery}
          ariaLabel="Search placement queue"
          placeholder="Search section, program, or subject..."
        />

        <div
          role="tablist"
          aria-label="Filter placement queue"
          className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 dark:border-white/10 dark:bg-white/5"
        >
          {QUEUE_FILTERS.map((option) => {
            const active = filter === option.value;
            const count = counts[option.value];
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={count === 0}
                onClick={() => setFilter(option.value)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "bg-navy-800 text-mist-100 shadow-xs dark:bg-white/15 dark:text-mist-100"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-navy-800 dark:bg-transparent dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
                }`}
              >
                <span>{option.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums font-bold leading-none ${
                    active
                      ? "bg-white/20 text-white dark:bg-white/20 dark:text-mist-100"
                      : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content list */}
      {groupedRows.length === 0 ? (
        <EmptyState title="No matching sections">
          No sections match your search or filter criteria. Try adjusting your search.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-5">
          {groupedRows.map(([group, rows]) => (
            <section key={group} aria-label={group} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 dark:border-white/10">
                <h4 className="font-display text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {group}
                </h4>
                <Badge tone="slate" compact>
                  {rows.length} {rows.length === 1 ? "section" : "sections"}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                {rows.map(({ set, setDrafts, complete, remaining, placed }) => {
                  const expanded = expandedSetId === set.setId;
                  const status = complete
                    ? { label: "Ready to save", tone: "emerald" as BadgeTone }
                    : STATUS_STYLES[set.status];
                  const progress = set.sessionCount > 0 ? Math.round((placed / set.sessionCount) * 100) : 0;

                  return (
                    <div
                      key={set.setId}
                      className={`overflow-hidden rounded-xl border transition-all duration-150 ${
                        complete
                          ? "border-emerald-300 bg-emerald-50/20 dark:border-emerald-400/20 dark:bg-emerald-400/5"
                          : expanded
                            ? "border-slate-300 bg-white shadow-xs dark:border-white/20 dark:bg-white/5"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/2 dark:hover:border-white/20"
                      }`}
                    >
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setExpandedSetId(expanded ? null : set.setId)}
                        className="w-full cursor-pointer p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display text-sm tracking-wide text-navy-800 dark:text-mist-100">
                                {set.setName ?? set.setCode}
                              </h3>
                              {set.setCode && set.setName && set.setCode !== set.setName ? (
                                <span className="font-body text-xs text-slate-400 dark:text-slate-500">
                                  ({set.setCode})
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                              {placed} of {set.sessionCount} meetings placed ·{" "}
                              <span className={remaining > 0 ? "font-medium text-amber-600 dark:text-gold-400" : "font-medium text-emerald-600 dark:text-emerald-400"}>
                                {remaining} left
                              </span>
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <Badge tone={status.tone} compact>{status.label}</Badge>
                            <span className="text-slate-400" aria-hidden="true">
                              {expanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                            </span>
                          </div>
                        </div>

                        {/* Progress track */}
                        <div className="mt-3">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                complete
                                  ? "bg-emerald-500 dark:bg-emerald-400"
                                  : "bg-navy-700 dark:bg-gold-400"
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </button>

                      {expanded ? (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-3.5 pb-3.5 pt-3 dark:border-white/10 dark:bg-white/2">
                          {!set.editable ? (
                            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                              <span className="mt-0.5 shrink-0" aria-hidden="true">
                                <LockIcon size={14} />
                              </span>
                              <span>
                                This section is at <strong className="font-semibold">{set.releaseStatus}</strong> and cannot be edited.
                              </span>
                            </div>
                          ) : null}

                          <h5 className="font-body text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Required subjects ({set.unplaced.length})
                          </h5>

                          <ul className="mt-2 flex flex-col gap-2">
                            {set.unplaced.map((subject) => {
                              const subjectRemaining = remainingAfterDrafts(set, subject, setDrafts);
                              const done = subjectRemaining === 0;
                              const stagedCount = subject.remaining - subjectRemaining;

                              return (
                                <li
                                  key={subject.subjectId}
                                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs transition-colors ${
                                    done
                                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-400/20 dark:bg-emerald-400/10"
                                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-surface-raised"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-body font-semibold text-navy-800 dark:text-mist-100">
                                        {subject.subjectCode}
                                      </span>
                                      {stagedCount > 0 ? (
                                        <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                                          (+{stagedCount} staged)
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="truncate font-body text-slate-500 dark:text-slate-400">
                                      {subject.subjectTitle}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-1.5">
                                    {done ? (
                                      <Badge tone="emerald" compact>Placed</Badge>
                                    ) : (
                                      <Badge tone="gold" compact>
                                        {subjectRemaining} left
                                      </Badge>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>

                          {setDrafts.length > 0 ? (
                            <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3 dark:border-sky-400/20 dark:bg-sky-400/10">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-body text-xs font-semibold text-sky-900 dark:text-sky-200">
                                  {setDrafts.length} placement{setDrafts.length === 1 ? "" : "s"} staged
                                </p>
                                {complete ? (
                                  <Badge tone="emerald" compact>Ready to save</Badge>
                                ) : (
                                  <Badge tone="gold" compact>{remaining} left</Badge>
                                )}
                              </div>
                              <p className="mt-1 font-body text-xs text-slate-600 dark:text-slate-300">
                                {complete
                                  ? "All meetings for this section have been drafted. You can now save these adjustments."
                                  : "Nothing is saved yet. Place every remaining meeting on the timetable before saving."}
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="primary"
                                  block={false}
                                  disabled={!complete || savingSetId != null}
                                  isLoading={savingSetId === set.setId}
                                  loadingLabel="Saving..."
                                  onClick={() => onSaveSet(set)}
                                  className="text-xs"
                                >
                                  Save {set.setName ?? set.setCode}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  block={false}
                                  disabled={savingSetId != null}
                                  onClick={() => onDiscardSetDrafts(set.setId)}
                                  className="text-xs"
                                >
                                  Discard drafts
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
