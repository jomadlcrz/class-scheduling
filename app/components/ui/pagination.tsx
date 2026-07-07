import { PAGE_SIZE_OPTIONS, type PageSizeOption } from "~/hooks/use-pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "~/components/ui/icons";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  pageSize: PageSizeOption;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
};

function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (page >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", page - 1, page, page + 1, "…", total];
}

const btnBase =
  "grid min-w-8 h-8 place-items-center rounded-lg px-1 font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400";
const btnActive = "bg-navy-700 text-white dark:bg-white/15 dark:text-white";
const btnIdle =
  "text-slate-600 hover:bg-slate-200/60 hover:text-navy-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";
const btnDisabled = "cursor-not-allowed text-slate-300 dark:text-slate-600";

export function Pagination({
  page,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 font-body text-sm">
      {/* Result count */}
      <p className="text-slate-500 dark:text-slate-400">
        Showing{" "}
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of{" "}
        <span className="font-medium text-slate-700 dark:text-slate-200">{totalItems}</span>
      </p>

      <div className="flex items-center gap-3">
        {/* Page buttons */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className={`${btnBase} ${page === 1 ? btnDisabled : btnIdle}`}
          >
            <ChevronLeftIcon />
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`ellipsis-${i}`}
                className="grid h-8 min-w-8 place-items-center text-slate-400 dark:text-slate-600"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={`${btnBase} ${p === page ? btnActive : btnIdle}`}
              >
                {p}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            className={`${btnBase} ${page === totalPages ? btnDisabled : btnIdle}`}
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Per-page selector */}
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <label htmlFor="page-size" className="whitespace-nowrap">
            Per page
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSizeOption)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 transition-colors duration-150 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/25 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-navy-900 dark:[&>option]:text-white"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
