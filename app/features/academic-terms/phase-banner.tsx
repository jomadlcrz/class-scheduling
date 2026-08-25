import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { termPhaseService } from "~/services/term-phase.service";
import type { TermPhaseResponse } from "~/types/term-phase";

type PhaseBannerProps = {
  syId?: number | null;
  semesterNumber?: number | null;
  role?: "registrar" | "dean" | "faculty" | "student" | string;
  className?: string;
};

function formatCountdown(targetIso: string, serverTimeIso: string): string {
  const target = new Date(targetIso).getTime();
  const server = new Date(serverTimeIso).getTime();
  const diffMs = target - server;

  if (diffMs <= 0) return "passed";

  const diffSec = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);

  if (days > 1) return `in ${days} days`;
  if (days === 1) return "in 1 day";
  if (hours > 1) return `in ${hours} hours`;
  if (hours === 1) return "in 1 hour";
  if (minutes > 1) return `in ${minutes} mins`;
  return "in less than a minute";
}

export function PhaseBanner({ syId, semesterNumber, role = "registrar", className = "" }: PhaseBannerProps) {
  const [phaseData, setPhaseData] = useState<TermPhaseResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetcher =
      syId && semesterNumber
        ? termPhaseService.getTermPhase(syId, semesterNumber)
        : termPhaseService.getCurrentTermPhase();

    fetcher
      .then((data) => {
        if (!cancelled) setPhaseData(data.syId ? data : null);
      })
      .catch(() => {
        if (!cancelled) setPhaseData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [syId, semesterNumber]);

  if (loading || !phaseData || !phaseData.governed) {
    // Ungoverned terms gate nothing — do not render the banner
    return null;
  }

  const { phase, phaseLabel, majorsDueAt, suggestionsDueAt, serverTime } = phaseData;

  // Determine which deadline and message to show based on the viewer's role
  let deadlineText: string | null = null;
  let deadlineLapsed = false;

  if (role === "dean" || role === "registrar") {
    if (phase === "major_scheduling" && majorsDueAt) {
      const countdown = formatCountdown(majorsDueAt, serverTime);
      deadlineLapsed = phaseData.majorsDeadlinePassed;
      deadlineText = deadlineLapsed
        ? `Major scheduling deadline passed (${new Date(majorsDueAt).toLocaleDateString()})`
        : `Majors due ${countdown} (${new Date(majorsDueAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })})`;
    }
  }

  if (role === "faculty" || role === "registrar" || (role === "dean" && phase === "suggestion_window")) {
    if (phase === "suggestion_window" && suggestionsDueAt) {
      const countdown = formatCountdown(suggestionsDueAt, serverTime);
      deadlineLapsed = phaseData.suggestionsDeadlinePassed;
      deadlineText = deadlineLapsed
        ? `Shift request deadline passed (${new Date(suggestionsDueAt).toLocaleDateString()})`
        : `Shift requests due ${countdown} (${new Date(suggestionsDueAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })})`;
    }
  }

  let helperMessage = "";
  if (phase === "major_scheduling") {
    helperMessage = "Deans are submitting major-subject schedules across all departments.";
  } else if (phase === "generation") {
    helperMessage = "Registrar is generating section timetables against finalized majors.";
  } else if (phase === "suggestion_window") {
    helperMessage = "Instructors are reviewing schedules and submitting change requests.";
  } else if (phase === "resolution") {
    helperMessage =
      role === "faculty"
        ? "Suggestions are under resolution. If you did not respond, the schedule you were given stands."
        : "Resolving suggestion requests across all departments.";
  } else if (phase === "finalized") {
    helperMessage = "The term's schedules are finalized and published.";
  }

  return (
    <div
      className={`rounded-xl border border-sky-200 bg-linear-to-r from-sky-50 to-indigo-50/40 p-4 text-slate-800 shadow-xs dark:border-sky-800/50 dark:from-sky-950/30 dark:to-indigo-950/20 dark:text-slate-200 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-sky-200 dark:ring-sky-900" />
          <span className="text-sm font-semibold text-navy-800 dark:text-mist-100">
            {phaseData.termLabel ? `${phaseData.termLabel} · ${phaseLabel}` : `Term Phase: ${phaseLabel}`}
          </span>
          <Badge tone="navy">
            Governed
          </Badge>
        </div>

        {deadlineText && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${deadlineLapsed ? "text-amber-700 dark:text-amber-400" : "text-sky-800 dark:text-sky-300"}`}>
              {deadlineText}
            </span>
          </div>
        )}
      </div>

      {helperMessage && (
        <p className="mt-1.5 font-body text-xs text-slate-600 dark:text-slate-400">
          {helperMessage}
        </p>
      )}
    </div>
  );
}
