import { Link } from "react-router";
import { CalendarIcon } from "../../components/ui/icons";

export function ConflictResolution() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">
          <CalendarIcon />
        </span>
        <div>
          <p className="font-body text-sm font-semibold text-navy-700 dark:text-white">
            Resolve Conflicts
          </p>
          <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
            To fix a conflict, edit the affected schedule entries directly on the Schedules page.
            Change the assigned faculty, room, or time slot to eliminate the overlap.
          </p>
          <Link
            to="/schedules"
            className="mt-3 inline-flex items-center gap-1.5 font-body text-sm font-medium text-navy-700 underline underline-offset-2 hover:text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-gold-400 dark:hover:text-gold-300"
          >
            Go to Schedules
          </Link>
        </div>
      </div>
    </div>
  );
}
