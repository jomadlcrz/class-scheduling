import { Link } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { AlertIcon, ChevronRightIcon } from "~/components/ui/icons";
import type { AutoGenerateResolution } from "~/services/schedule.service";

/**
 * What Resolve found and deliberately would not do.
 *
 * Resolve applies only plans that give nothing up. When the only way to fit a
 * subject costs an already-saved session its slot, the plan is skipped — and
 * until now the Registrar saw nothing but "Could not fit …", which reads as
 * "no solution exists" when in fact one does and the engine already priced it.
 *
 * This card says the opposite plainly: a solution exists, here is exactly what
 * it would cost, and here is where you can take that decision.
 */
export function ResolutionManualReview({
  resolution,
}: {
  resolution: AutoGenerateResolution;
}) {
  if (resolution.manualReview.length === 0) return null;

  return (
    <Alert variant="info">
      <AlertIcon />
      <AlertTitle>A solution exists, but it costs another class its slot</AlertTitle>
      <AlertDescription>
        {resolution.manualReviewHint ? <p>{resolution.manualReviewHint}</p> : null}

        <ul className="mt-3 flex flex-col gap-2.5">
          {resolution.manualReview.map((option, index) => (
            <li
              key={`${option.subjectCode ?? "option"}-${index}`}
              className="rounded-lg border border-blue-200 bg-white/60 p-2.5 dark:border-blue-400/20 dark:bg-white/5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-body text-xs font-bold text-navy-800 dark:text-white">
                  {option.subjectCode ?? "Unplaced subject"}
                </span>
                {option.setName ? <Badge tone="slate">{option.setName}</Badge> : null}
                {option.instructorName ? (
                  <span className="font-body text-[11px] text-slate-600 dark:text-slate-300">
                    {option.instructorName}
                  </span>
                ) : null}
              </div>

              <p className="mt-1.5 font-body text-[11px] font-semibold text-blue-900 dark:text-blue-200">
                Would take the slot from:
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {option.displaces.map((row) => (
                  <li
                    key={row.scheduleId}
                    className="font-body text-[11px] text-slate-700 dark:text-slate-300"
                  >
                    {row.subjectCode ?? `Schedule #${row.scheduleId}`}
                    {row.setLabel ? ` · ${row.setLabel}` : ""}
                    {row.day ? ` — ${row.day}` : ""}
                    {row.start && row.end ? ` ${row.start}–${row.end}` : ""}
                  </li>
                ))}
              </ul>

              {option.reason ? (
                <p className="mt-1.5 font-body text-[11px] italic leading-snug text-slate-500 dark:text-slate-400">
                  {option.reason}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="mt-3">
          <Link
            to="/schedules/adjustment-board"
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-blue-300 bg-white px-2.5 py-1 font-body text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-blue-400/30 dark:bg-transparent dark:text-blue-200 dark:hover:bg-blue-400/10"
          >
            Open the Schedule Adjustment Board
            <ChevronRightIcon />
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
