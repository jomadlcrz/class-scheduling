/**
 * "What should I know before I approve this?" — the Dean's pre-approval
 * review, answering the three things the Dean of CBA asked to see.
 *
 * THE DESIGN PROBLEM. The three blocks want opposite treatments.
 *
 *   Conflicts are all supposed to PASS, so the interesting state is the boring
 *   one. A green list is worth showing — "no conflicts" is only believable
 *   when you can see which questions were asked — but it must not take up the
 *   room a real problem would need. So it collapses to one line when clear and
 *   opens itself when anything fails.
 *
 *   Room availability is reference material, not a to-do. It is numbers a Dean
 *   reads once, so it sits behind its own disclosure.
 *
 *   Concerns are the actual work, so they lead and stay open.
 *
 * Nothing here blocks approving. A Dean who disagrees with a finding approves
 * anyway; this panel exists so that decision is an informed one.
 */
import { useEffect, useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import {
  AlertTriangleIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon,
  DoorOpenIcon, InfoCircleIcon,
} from "~/components/ui/icons";
import { preApprovalReviewService } from "~/services/pre-approval-review.service";
import type {
  ClearanceCheck, PreApprovalReview, ReviewConcern, ReviewSeverity,
} from "~/types/pre-approval-review";

const SEVERITY_TONE: Record<ReviewSeverity, BadgeTone> = {
  critical: "red",
  warning: "gold",
  notice: "slate",
};

const SEVERITY_LABEL: Record<ReviewSeverity, string> = {
  critical: "Needs a decision",
  warning: "Worth a look",
  notice: "For information",
};

/** Concern items have different shapes per `key`; this renders any of them
 *  without the panel needing to know which is which. */
function itemLine(item: Record<string, unknown>): string {
  const name = item.name ?? item.setCode ?? item.subjectCode;
  const bits: string[] = [];
  if (item.subjectCode && item.setCode) bits.push(`${item.subjectCode} (${item.setCode})`);
  else if (name) bits.push(String(name));
  if (item.day) bits.push(String(item.day));
  if (item.startsAt) bits.push(String(item.startsAt));
  if (item.hours != null) {
    const cap = item.cap ?? item.normalCap ?? item.normalLoad;
    bits.push(cap != null ? `${item.hours} h (limit ${cap})` : `${item.hours} h`);
  }
  if (item.roomName) bits.push(String(item.roomName));
  if (item.shortBy != null) {
    bits.push(`${item.studentCount}/${item.roomCapacity} — ${item.shortBy} over`);
  }
  return bits.join(" · ");
}

function ConcernCard({ concern }: { concern: ReviewConcern }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? concern.items : concern.items.slice(0, 4);
  const dot =
    concern.severity === "critical"
      ? "bg-red-500"
      : concern.severity === "warning"
        ? "bg-orange-500"
        : "bg-slate-300 dark:bg-white/20";

  return (
    <li className="flex gap-2.5 border-t border-slate-200/70 py-2.5 first:border-t-0 first:pt-0 dark:border-white/10">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
            {concern.title}
          </span>
          <Badge tone={SEVERITY_TONE[concern.severity]}>
            {SEVERITY_LABEL[concern.severity]}
          </Badge>
          <span className="font-body text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {concern.items.length}
          </span>
        </div>
        <p className="mt-1 font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {concern.detail}
        </p>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {shown.map((item, i) => (
            <li
              key={i}
              className="font-body text-xs text-slate-600 dark:text-slate-300"
            >
              <span className="text-slate-400 dark:text-slate-500">· </span>
              {itemLine(item)}
            </li>
          ))}
        </ul>
        {concern.items.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-1 font-body text-xs font-medium text-navy-700 underline underline-offset-2 hover:text-navy-900 dark:text-mist-200 dark:hover:text-white"
          >
            {showAll ? "Show fewer" : `Show all ${concern.items.length}`}
          </button>
        )}
      </div>
    </li>
  );
}

function ClearanceRow({ check }: { check: ClearanceCheck }) {
  return (
    <li className="flex items-start gap-2 py-1">
      <span
        className={`mt-0.5 shrink-0 ${
          check.passed
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {check.passed ? <CheckIcon /> : <AlertTriangleIcon />}
      </span>
      <div className="min-w-0 flex-1">
        <span className="font-body text-sm text-navy-800 dark:text-mist-100">
          {check.title}
        </span>
        {!check.passed && (
          <>
            <span className="ml-2 font-body text-xs font-semibold text-red-700 dark:text-red-300">
              {check.count} found
            </span>
            <p className="mt-0.5 font-body text-xs text-slate-600 dark:text-slate-300">
              {check.why}
            </p>
            <ul className="mt-0.5">
              {check.examples.map((e, i) => (
                <li key={i} className="font-body text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">· </span>
                  {e}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </li>
  );
}

/** "Laboratory" -> "laboratories", not "laboratorys". The room-type labels
 *  come from the backend enum, so they are pluralised here rather than
 *  suffixed blindly. */
function roomTypePlural(label: string) {
  const lower = label.toLowerCase();
  if (lower.endsWith("y")) return `${lower.slice(0, -1)}ies`;
  return `${lower}s`;
}

function Rooms({ review }: { review: PreApprovalReview }) {
  const { access, usage, fit, totals } = review.rooms;
  const busiest = usage.slice(0, 6);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {access.map((a) => (
          <span
            key={a.roomType}
            className="rounded-md border border-slate-200 px-2 py-1 font-body text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
          >
            <span className="font-semibold text-navy-800 dark:text-mist-100">
              {a.permitted} of {a.total}
            </span>{" "}
            {roomTypePlural(a.roomType)} allowed
            {a.lockedOut > 0 && (
              <span className="text-slate-500 dark:text-slate-400">
                {" "}· {a.lockedOut} locked out
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Room Access decides which rooms this program may be scheduled into. A program
        locked out of most of the campus runs short of room time for a reason no
        timetable shows.
      </p>

      <div>
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Busiest rooms · {totals.roomsUsed} of {totals.roomsPermitted} in use ·{" "}
          {totals.bookedHours} h booked
        </p>
        <ul className="mt-1.5 flex flex-col gap-1">
          {busiest.map((u) => (
            <li key={u.roomId} className="flex items-center gap-2">
              <span className="w-28 shrink-0 truncate font-body text-xs text-navy-800 dark:text-mist-100">
                {u.roomName}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <span
                  className="block h-full rounded-full bg-navy-600 dark:bg-navy-300"
                  style={{ width: `${Math.min(100, u.utilisationPercent)}%` }}
                />
              </span>
              <span className="w-32 shrink-0 text-right font-body text-xs tabular-nums text-slate-600 dark:text-slate-300">
                {u.bookedHours} h · {u.freeHours} h free
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="font-body text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-navy-800 dark:text-mist-100">Seats:</span>{" "}
        {fit.overCapacity.length > 0 ? (
          <span className="text-red-700 dark:text-red-300">
            {fit.overCapacity.length} class
            {fit.overCapacity.length === 1 ? "" : "es"}{" "}
            {fit.overCapacity.length === 1 ? "is" : "are"} larger than the room given.
          </span>
        ) : (
          "every class fits the room it was given."
        )}{" "}
        {fit.spareSeats === 0
          ? "There is no spare seat anywhere in the program — one more enrolment needs a bigger room."
          : `${fit.spareSeats} spare seats across the program, with ${fit.atCapacityCount} class${
              fit.atCapacityCount === 1 ? "" : "es"
            } down to their last two.`}
      </p>
    </div>
  );
}

export function PreApprovalReviewPanel({
  syId,
  semesterNumber,
  programId,
}: {
  syId: number;
  semesterNumber: number;
  programId: number;
}) {
  const [review, setReview] = useState<PreApprovalReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showChecks, setShowChecks] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    preApprovalReviewService
      .get(syId, semesterNumber, programId)
      .then((data) => {
        if (!live) return;
        setReview(data);
        // A failed check is not something to go looking for. If one exists,
        // the list is open before the Dean has clicked anything.
        if (data.summary.checksFailed > 0) {
          setOpen(true);
          setShowChecks(true);
        }
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : "unavailable"))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [syId, semesterNumber, programId]);

  if (loading) {
    return (
      <p className="font-body text-xs text-slate-500 dark:text-slate-400">
        Reviewing this schedule…
      </p>
    );
  }
  // Must not read as "all clear". It says what happened and gets out of the way.
  if (error || !review) {
    return (
      <p className="font-body text-xs text-slate-500 dark:text-slate-400">
        Pre-approval review unavailable right now.
      </p>
    );
  }

  const { summary, clearance, concerns } = review;
  const worst: ReviewSeverity | null = summary.checksFailed
    ? "critical"
    : summary.critical
      ? "critical"
      : summary.warning
        ? "warning"
        : summary.notice
          ? "notice"
          : null;

  const borderTone =
    worst === "critical"
      ? "border-red-200 dark:border-red-400/20"
      : worst === "warning"
        ? "border-orange-200 dark:border-orange-400/20"
        : worst === "notice"
          ? "border-slate-200 dark:border-white/10"
          : "border-emerald-200 dark:border-emerald-400/20";
  const headTone =
    worst === "critical"
      ? "bg-red-50/70 dark:bg-red-400/5"
      : worst === "warning"
        ? "bg-orange-50/70 dark:bg-orange-400/5"
        : worst === "notice"
          ? "bg-slate-50/70 dark:bg-white/5"
          : "bg-emerald-50/70 dark:bg-emerald-400/5";

  return (
    <section className={`overflow-hidden rounded-lg border ${borderTone}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left ${headTone}`}
      >
        <span className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400">
          {worst === null ? (
            <CheckIcon />
          ) : worst === "notice" ? (
            <InfoCircleIcon />
          ) : (
            <AlertTriangleIcon />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
              Before you approve
            </span>
            {summary.checksFailed > 0 && (
              <Badge tone="red">{summary.checksFailed} check failed</Badge>
            )}
            {summary.critical > 0 && (
              <Badge tone="red">{summary.critical} needs a decision</Badge>
            )}
            {summary.warning > 0 && (
              <Badge tone="gold">{summary.warning} worth a look</Badge>
            )}
            {summary.notice > 0 && <Badge tone="slate">{summary.notice} FYI</Badge>}
          </span>
          <span className="mt-0.5 block font-body text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {summary.headline}
          </span>
        </span>
        <span className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">
          {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-slate-200/70 bg-white px-3 py-3 dark:border-white/10 dark:bg-transparent">
          {concerns.length > 0 ? (
            <ul className="flex flex-col">
              {concerns.map((c) => (
                <ConcernCard key={c.key} concern={c} />
              ))}
            </ul>
          ) : (
            <p className="font-body text-sm text-slate-600 dark:text-slate-300">
              Nothing needs your attention: no overloads, every class has an
              instructor, and every class fits its room.
            </p>
          )}

          {/* Conflicts: one line when clear, opened for you when not. */}
          <div className="rounded-md border border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => setShowChecks((v) => !v)}
              aria-expanded={showChecks}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
            >
              <span
                className={
                  summary.checksFailed
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {summary.checksFailed ? <AlertTriangleIcon /> : <CheckIcon />}
              </span>
              <span className="flex-1 font-body text-sm text-navy-800 dark:text-mist-100">
                {summary.checksFailed
                  ? `${summary.checksFailed} of ${summary.checksRun} conflict checks did not pass`
                  : `All ${summary.checksRun} conflict checks passed`}
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {showChecks ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </span>
            </button>
            {showChecks && (
              <div className="border-t border-slate-200/70 px-2.5 py-2 dark:border-white/10">
                <ul className="flex flex-col">
                  {clearance.map((c) => (
                    <ClearanceRow key={c.title} check={c} />
                  ))}
                </ul>
                <p className="mt-2 font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  These are re-run against the saved schedule each time you open this,
                  not read from when it was generated.
                </p>
              </div>
            )}
          </div>

          {/* Room availability: reference, so it stays behind a disclosure. */}
          <div className="rounded-md border border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => setShowRooms((v) => !v)}
              aria-expanded={showRooms}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
            >
              <span className="text-slate-500 dark:text-slate-400">
                <DoorOpenIcon />
              </span>
              <span className="flex-1 font-body text-sm text-navy-800 dark:text-mist-100">
                Room availability
                <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                  {review.rooms.totals.roomsUsed} rooms ·{" "}
                  {review.rooms.totals.bookedHours} h booked
                </span>
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {showRooms ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </span>
            </button>
            {showRooms && (
              <div className="border-t border-slate-200/70 px-2.5 py-2.5 dark:border-white/10">
                <Rooms review={review} />
              </div>
            )}
          </div>

          <p className="border-t border-slate-200/70 pt-2.5 font-body text-xs leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
            Checked {review.meta.meetingsExamined} meetings across{" "}
            {review.meta.sectionCount} sections. Nothing here stops you approving —
            it is here so the decision is an informed one.
          </p>
        </div>
      )}
    </section>
  );
}
