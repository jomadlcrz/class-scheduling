import { TrashIcon } from "~/components/ui/icons";

export function RecentlyDeleted() {
  return (
    <div className="max-w-lg">
      <div className="flex flex-col gap-1">
        <h2 className="font-body text-base font-semibold text-navy-700 dark:text-white">
          Recently Deleted
        </h2>
        <p className="font-body text-sm text-slate-500 dark:text-slate-400">
          Items deleted within the last 30 days. Restore them before they are permanently removed.
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-12 text-center dark:border-white/10">
        <span className="text-slate-300 dark:text-white/20">
          <TrashIcon />
        </span>
        <p className="font-body text-sm font-medium text-slate-500 dark:text-slate-400">
          No recently deleted items
        </p>
        <p className="max-w-xs font-body text-xs text-slate-400 dark:text-slate-500">
          Deleted subjects and other recoverable items will appear here for 30 days.
        </p>
      </div>
    </div>
  );
}
