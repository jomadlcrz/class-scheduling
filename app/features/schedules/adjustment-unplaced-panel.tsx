import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { ChevronDownIcon, ChevronRightIcon, LockIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
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
    tone: "green",
  },
  incomplete: {
    label: "Incomplete",
    tone: "gold",
  },
  unscheduled: {
    label: "Not generated",
    tone: "slate",
  },
};

type QueueFilter = "all" | "incomplete" | "unscheduled" | "ready";

const QUEUE_FILTERS: { value: QueueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "incomplete", label: "Incomplete" },
  { value: "unscheduled", label: "Not generated" },
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
      <div className="p-6">
        <h3 className="font-display text-lg font-semibold tracking-wide text-navy-800 dark:text-white">
          Nothing unplaced
        </h3>
        <p className="mt-2 font-body text-sm text-slate-600 dark:text-slate-300">
          Every section in view has its whole curriculum on the timetable. Moving a class
          here still works — this list only fills up when generation comes back short.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-950">
        <label htmlFor={searchId} className="sr-only">
          Search placement queue
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search section or subject"
            className={`${inputClassName} py-1.5 pl-9 text-xs`}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter placement queue">
          {QUEUE_FILTERS.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                disabled={counts[option.value] === 0}
                onClick={() => setFilter(option.value)}
                className={[
                  "cursor-pointer rounded-md border px-2 py-1 font-body text-[0.6875rem] font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40",
                  active
                    ? "border-navy-800 bg-navy-800 text-white dark:border-white dark:bg-white dark:text-navy-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
                ].join(" ")}
              >
                {option.label} <span className="tabular-nums">{counts[option.value]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {groupedRows.length === 0 ? (
        <div className="p-6 text-center">
          <p className="font-body text-sm font-semibold text-navy-800 dark:text-white">No matching sections</p>
          <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
            Try another search or queue filter.
          </p>
        </div>
      ) : (
        <div>
          {groupedRows.map(([group, rows]) => (
            <section key={group} aria-label={group}>
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <p className="font-body text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {group}
                </p>
                <span className="font-body text-[0.6875rem] tabular-nums text-slate-500 dark:text-slate-400">
                  {rows.length}
                </span>
              </div>

              {rows.map(({ set, setDrafts, complete, remaining, placed }) => {
                const expanded = expandedSetId === set.setId;
                const status = complete
                  ? { label: "Ready to save", tone: "green" as BadgeTone }
                  : STATUS_STYLES[set.status];
                const progress = set.sessionCount > 0 ? Math.round((placed / set.sessionCount) * 100) : 0;
                return (
                  <div key={set.setId} className="border-b border-slate-200 last:border-b-0 dark:border-white/10">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setExpandedSetId(expanded ? null : set.setId)}
                      className="w-full cursor-pointer px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 dark:hover:bg-white/5"
                    >
                      <span className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true">
                          {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="truncate font-body text-xs font-semibold text-navy-800 dark:text-white">
                              {set.setName ?? set.setCode}
                            </span>
                            <Badge tone={status.tone} compact>{status.label}</Badge>
                          </span>
                          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                            <span className="block h-full rounded-full bg-sky-500 transition-[width]" style={{ width: `${progress}%` }} />
                          </span>
                          <span className="mt-1 flex items-center justify-between font-body text-[0.6875rem] text-slate-500 dark:text-slate-400">
                            <span>{placed} of {set.sessionCount} meetings placed</span>
                            <span>{remaining} left</span>
                          </span>
                        </span>
                      </span>
                    </button>

                    {expanded ? (
                      <div className="border-t border-slate-100 bg-slate-50/60 px-3 pb-3 pt-2.5 dark:border-white/5 dark:bg-white/[0.025]">
                        {!set.editable ? (
                          <p className="mb-2 flex items-start gap-1.5 font-body text-xs leading-snug text-amber-800 dark:text-amber-100/90">
                            <span className="mt-0.5 shrink-0" aria-hidden="true"><LockIcon size={12} /></span>
                            <span>This section is at <span className="font-semibold">{set.releaseStatus}</span> and cannot be edited here.</span>
                          </p>
                        ) : null}

                        <ul className="flex flex-col gap-1.5">
                          {set.unplaced.map((subject) => {
                            const subjectRemaining = remainingAfterDrafts(set, subject, setDrafts);
                            const done = subjectRemaining === 0;
                            return (
                              <li key={subject.subjectId}>
                                <div
                                  className={[
                                    "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
                                    done
                                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-400/10"
                                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-transparent",
                                  ].join(" ")}
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate font-body text-xs font-semibold text-navy-800 dark:text-white">{subject.subjectCode}</span>
                                    <span className="block truncate font-body text-[0.6875rem] text-slate-500 dark:text-slate-400">{subject.subjectTitle}</span>
                                  </span>
                                  {done ? (
                                    <Badge tone="green">Placed</Badge>
                                  ) : (
                                    <Badge tone="slate">
                                      {subject.placed + (subject.remaining - subjectRemaining)} of {subject.needed}
                                    </Badge>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>

                        {setDrafts.length > 0 ? (
                          <div className="mt-2.5 rounded-lg border border-sky-200 bg-sky-50/70 p-2.5 dark:border-sky-400/25 dark:bg-sky-400/5">
                            <p className="font-body text-xs font-semibold text-sky-800 dark:text-sky-300">
                              {setDrafts.length} placement{setDrafts.length === 1 ? "" : "s"} staged
                            </p>
                            <p className="mt-1 font-body text-[0.6875rem] leading-snug text-sky-700 dark:text-sky-200/80">
                              {complete
                                ? "This section is complete and ready to save."
                                : "Nothing is saved yet. Place every remaining meeting before saving."}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={!complete || savingSetId != null}
                                onClick={() => onSaveSet(set)}
                                className="cursor-pointer rounded-md bg-navy-800 px-2.5 py-1 font-body text-xs font-semibold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-200"
                              >
                                {savingSetId === set.setId ? "Saving…" : `Save ${set.setName ?? set.setCode}`}
                              </button>
                              <button
                                type="button"
                                disabled={savingSetId != null}
                                onClick={() => onDiscardSetDrafts(set.setId)}
                                className="cursor-pointer rounded-md border border-slate-300 px-2.5 py-1 font-body text-xs font-semibold text-navy-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                              >
                                Discard
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
