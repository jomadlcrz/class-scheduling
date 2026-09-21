import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { formatTime12h } from "~/lib/time";
import {
  AVAILABILITY_WEEK_DAYS,
  type AvailabilityConfiguration,
} from "~/types/instructor-availability";

const PORTAL_DISPLAY_TRACKING = "tracking-wide";
const PORTAL_MICRO = "font-body text-xs text-slate-500 dark:text-slate-400";
const PORTAL_DESCRIPTION = "font-body text-sm text-slate-500 dark:text-slate-400";
const PORTAL_NOTE = "font-body text-xs text-slate-500 dark:text-slate-400";

/** Colour only — the words come from the backend's `decisionLabel`. */
const DECISION_TONE: Record<string, BadgeTone> = {
  accepted_as_sent: "emerald",
  changed: "gold",
  set_by_dean: "navy",
  not_configured: "slate",
};

/**
 * The availability the Dean SET — read-only, beside what the instructor sent.
 *
 * This is the half that matters: the schedule is built around these times,
 * not the ones in the grid below. A day with no times here means NOT
 * available, because a configuration lists every hour that is allowed. With
 * nothing configured at all there is no restriction, and the card says so
 * rather than drawing an empty week that reads as "available for nothing".
 */
export function DeanAvailabilityDecision({
  configuration,
  error,
}: {
  configuration: AvailabilityConfiguration | null;
  error: string | null;
}) {
  return (
    <Card className="mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 px-3 py-2.5 dark:border-white/8">
        <div className="min-w-0">
          <h2 className={`font-display text-sm ${PORTAL_DISPLAY_TRACKING} text-navy-800 dark:text-mist-100`}>
            Set by your Dean
          </h2>
          <p className={PORTAL_MICRO}>Your schedule is built around these times.</p>
        </div>
        {configuration && configuration.decisionLabel && (
          <Badge tone={DECISION_TONE[configuration.decision] ?? "slate"}>
            {configuration.decisionLabel}
          </Badge>
        )}
      </div>

      {error ? (
        <p role="alert" className="px-3 py-3 font-body text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : !configuration ? null : !configuration.configured ? (
        <p className={`px-3 py-3 ${PORTAL_DESCRIPTION}`}>
          Your Dean hasn&apos;t set your availability for this term yet. Until they do, you can be
          scheduled anywhere in the normal teaching day.
        </p>
      ) : (
        <>
          <ul className="list-none">
            {AVAILABILITY_WEEK_DAYS.map((day) => {
              const spans = configuration.windows.filter((w) => w.dayOfWeek === day);
              return (
                <li
                  key={day}
                  className="flex flex-col gap-1 border-b border-slate-200/60 px-3 py-2 sm:flex-row sm:items-baseline dark:border-white/6"
                >
                  <span
                    className={`shrink-0 font-display text-sm ${PORTAL_DISPLAY_TRACKING} text-navy-800 sm:w-28 dark:text-mist-100`}
                  >
                    {day}
                  </span>
                  {spans.length === 0 ? (
                    <span className={PORTAL_NOTE}>Not available</span>
                  ) : (
                    <span className="font-body text-sm tabular-nums text-navy-800 dark:text-mist-100">
                      {spans
                        .map((w) => `${formatTime12h(w.startTime)} – ${formatTime12h(w.endTime)}`)
                        .join(", ")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {configuration.note && (
            <div className="border-b border-slate-200/60 px-3 py-2.5 dark:border-white/6">
              <p className={PORTAL_MICRO}>Note from your Dean</p>
              <p className="mt-0.5 whitespace-pre-line font-body text-sm text-navy-800 dark:text-mist-100">
                {configuration.note}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <p className={PORTAL_MICRO}>
              {configuration.hours != null &&
                `${configuration.hours} hour${configuration.hours === 1 ? "" : "s"} a week`}
            </p>
            <p className={PORTAL_MICRO}>
              {[
                configuration.configuredBy,
                configuration.updatedAt &&
                  new Date(configuration.updatedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
