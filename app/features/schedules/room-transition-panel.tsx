/**
 * "Can everyone actually get there?" — the travel check on a program's saved
 * schedule, shown to the Dean before they approve it.
 *
 * WHY THIS PANEL EXISTS. Neither solver knows a building exists. A section's
 * and an instructor's clash rules are non-overlap in TIME alone, so a class
 * may legally begin the second another ends four floors away. Nothing else in
 * the app would ever tell the Dean that.
 *
 * WHY IT IS QUIET BY DEFAULT. Most findings are one flight of stairs, which is
 * fine and not worth a Dean's attention. The panel therefore leads with a
 * single sentence, shows only what needs acting on, and keeps the minor ones
 * behind a toggle — a list of 129 rows would hide the two that matter.
 *
 * It reports. It does not block, and there is no action on a finding: the fix
 * is a room or a time, both of which live on the Registrar's side.
 */
import { useEffect, useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { AlertTriangleIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, InfoCircleIcon, MapPinIcon } from "~/components/ui/icons";
import { roomTransitionService } from "~/services/room-transition.service";
import type {
  RoomTransitionFinding,
  RoomTransitionReport,
  TransitionSeverity,
} from "~/types/room-transition";

const SEVERITY_TONE: Record<TransitionSeverity, BadgeTone> = {
  critical: "red",
  warning: "gold",
  notice: "slate",
};

const SEVERITY_LABEL: Record<TransitionSeverity, string> = {
  critical: "Cannot make it",
  warning: "Tight",
  notice: "Minor",
};

/** Findings a Dean should read before approving, as opposed to context. */
function needsAttention(f: RoomTransitionFinding) {
  return f.severity !== "notice";
}

function SeverityDot({ severity }: { severity: TransitionSeverity }) {
  const colour =
    severity === "critical"
      ? "bg-red-500"
      : severity === "warning"
        ? "bg-orange-500"
        : "bg-slate-300 dark:bg-white/20";
  return <span className={`mt-1.5 size-2 shrink-0 rounded-full ${colour}`} aria-hidden />;
}

/** How long there is to make it. "no gap" rather than printing the same clock
 *  time on both sides, which reads as a rendering fault rather than as the
 *  point. */
function gapPhrase(minutes: number) {
  if (minutes <= 0) return "no gap";
  return `${minutes} min gap`;
}

/** The two rooms, drawn as the journey they are — self-sufficient, so a Dean
 *  scanning the list does not have to read the sentence to act on it. */
function Leg({ finding }: { finding: RoomTransitionFinding }) {
  const urgent = finding.gapMinutes <= 0 && finding.severity !== "notice";
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-xs text-slate-600 dark:text-slate-300">
      <span className="inline-flex items-center gap-1.5">
        <MapPinIcon />
        <span className="font-medium text-navy-800 dark:text-mist-100">
          {finding.from.subjectCode}
        </span>
        <span>{finding.from.roomName}</span>
        <span className="text-slate-500 dark:text-slate-400">· {finding.from.place}</span>
      </span>
      <span className="text-slate-400 dark:text-slate-500" aria-label="then">→</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="font-medium text-navy-800 dark:text-mist-100">
          {finding.to.subjectCode}
        </span>
        <span>{finding.to.roomName}</span>
        <span className="text-slate-500 dark:text-slate-400">· {finding.to.place}</span>
      </span>
      <span
        className={`rounded-md px-1.5 py-0.5 font-medium tabular-nums ${
          urgent
            ? "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-200"
            : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
        }`}
      >
        {finding.day} {finding.from.endsAt} · {gapPhrase(finding.gapMinutes)}
      </span>
    </div>
  );
}

function FindingRow({ finding }: { finding: RoomTransitionFinding }) {
  return (
    <li className="flex gap-2.5 border-t border-slate-200/70 py-2.5 first:border-t-0 first:pt-0 dark:border-white/10">
      <SeverityDot severity={finding.severity} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
            {finding.who.name}
          </span>
          <Badge tone={SEVERITY_TONE[finding.severity]}>
            {SEVERITY_LABEL[finding.severity]}
          </Badge>
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">
            {finding.who.kind === "section" ? "Section" : "Instructor"}
          </span>
        </div>
        <p className="mt-1 font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {finding.detail}
        </p>
        <Leg finding={finding} />
      </div>
    </li>
  );
}

export function RoomTransitionPanel({
  syId,
  semesterNumber,
  programId,
}: {
  syId: number;
  semesterNumber: number;
  programId?: number;
}) {
  const [report, setReport] = useState<RoomTransitionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [showMinor, setShowMinor] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    roomTransitionService
      .get(syId, semesterNumber, { programId })
      .then((data) => live && setReport(data))
      .catch(() => live && setFailed(true))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [syId, semesterNumber, programId]);

  if (loading) {
    return (
      <p className="font-body text-xs text-slate-500 dark:text-slate-400">
        Checking room changes…
      </p>
    );
  }

  // A failed check must not read as a clean one. It says so and stays out of
  // the way — this panel is advisory, and a Dean is not blocked by its absence.
  if (failed || !report) {
    return (
      <p className="font-body text-xs text-slate-500 dark:text-slate-400">
        Room-change check unavailable right now.
      </p>
    );
  }

  const { summary, findings, thresholds } = report;
  const attention = findings.filter(needsAttention);
  const minor = findings.filter((f) => !needsAttention(f));
  const clean = summary.total === 0;
  const worst: TransitionSeverity = summary.critical
    ? "critical"
    : summary.warning
      ? "warning"
      : "notice";

  const borderTone = clean
    ? "border-emerald-200 dark:border-emerald-400/20"
    : worst === "critical"
      ? "border-red-200 dark:border-red-400/20"
      : worst === "warning"
        ? "border-orange-200 dark:border-orange-400/20"
        : "border-slate-200 dark:border-white/10";
  const headTone = clean
    ? "bg-emerald-50/70 dark:bg-emerald-400/5"
    : worst === "critical"
      ? "bg-red-50/70 dark:bg-red-400/5"
      : worst === "warning"
        ? "bg-orange-50/70 dark:bg-orange-400/5"
        : "bg-slate-50/70 dark:bg-white/5";

  return (
    <section className={`overflow-hidden rounded-lg border ${borderTone}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left ${headTone}`}
      >
        <span className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400">
          {clean ? <CheckIcon /> : worst === "notice" ? <InfoCircleIcon /> : <AlertTriangleIcon />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
              Getting between rooms
            </span>
            {summary.critical > 0 && <Badge tone="red">{summary.critical} cannot make it</Badge>}
            {summary.warning > 0 && <Badge tone="gold">{summary.warning} tight</Badge>}
            {summary.notice > 0 && <Badge tone="slate">{summary.notice} minor</Badge>}
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
        <div className="border-t border-slate-200/70 bg-white px-3 py-3 dark:border-white/10 dark:bg-transparent">
          {clean ? (
            <p className="font-body text-sm text-slate-600 dark:text-slate-300">
              Every class either stays in its room or leaves enough time to walk. Checked{" "}
              {report.meta.meetingsExamined} meeting
              {report.meta.meetingsExamined === 1 ? "" : "s"}.
            </p>
          ) : (
            <>
              {attention.length > 0 ? (
                <ul className="flex flex-col">
                  {attention.map((f) => (
                    <FindingRow key={`${f.from.scheduleId}-${f.to.scheduleId}-${f.who.kind}`} finding={f} />
                  ))}
                </ul>
              ) : (
                <p className="font-body text-sm text-slate-600 dark:text-slate-300">
                  Nothing here needs a decision — every room change is walkable in the
                  time available.
                </p>
              )}

              {minor.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowMinor((v) => !v)}
                    aria-expanded={showMinor}
                    className="mt-3 font-body text-xs font-medium text-navy-700 underline underline-offset-2 hover:text-navy-900 dark:text-mist-200 dark:hover:text-white"
                  >
                    {showMinor ? "Hide" : "Show"} {minor.length} minor room change
                    {minor.length === 1 ? "" : "s"}
                  </button>
                  {showMinor && (
                    <ul className="mt-2 flex flex-col">
                      {minor.map((f) => (
                        <FindingRow key={`${f.from.scheduleId}-${f.to.scheduleId}-${f.who.kind}`} finding={f} />
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}

          <p className="mt-3 border-t border-slate-200/70 pt-2.5 font-body text-xs leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
            A room change counts when the next class starts within{" "}
            {thresholds.gapConsideredMinutes} minutes and the room is on another floor or
            in another building. Staying in the same room never counts, and online classes
            are not somewhere anyone walks to. Instructor findings cover their whole week,
            including any teaching they do for other programs.
          </p>
        </div>
      )}
    </section>
  );
}
