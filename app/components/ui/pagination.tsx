import { useState, type ReactNode } from "react";
import { Button } from "~/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MinusIcon,
  PlusIcon,
} from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";

const navButtonClassName =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-navy-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-surface-raised dark:text-slate-200 dark:hover:bg-white/10";

const iconButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-navy-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-surface-raised dark:text-slate-200 dark:hover:bg-white/10";

const pageButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-navy-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-surface-raised dark:text-slate-200 dark:hover:bg-white/10";

const activePageButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm font-semibold text-navy-800 dark:border-white/15 dark:bg-navy-800 dark:text-slate-100";

const activePillClassName =
  "inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm font-semibold text-navy-800 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-navy-800 dark:text-slate-100";

const ellipsisButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-400 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-surface-raised dark:text-slate-400 dark:hover:bg-white/10";

/** First, last, current, and one neighbor on each side; gaps become "ellipsis". */
function pageRange(current: number, total: number): (number | "ellipsis")[] {
  const range: (number | "ellipsis")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      range.push(i);
    } else if (range[range.length - 1] !== "ellipsis") {
      range.push("ellipsis");
    }
  }
  return range;
}

type PaginationProps = {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const items = pageRange(currentPage, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className="mt-4 flex w-full flex-col items-center gap-2"
    >
      {totalPages > 1 && (
        <ul className="flex flex-wrap items-center justify-center gap-2">
        {hasPrevious && (
          <li>
            <button
              type="button"
              aria-label="Go to first page"
              onClick={() => onPageChange(1)}
              className={iconButtonClassName}
            >
              <ChevronsLeftIcon />
            </button>
          </li>
        )}
        {hasPrevious && (
          <li>
            <button
              type="button"
              aria-label="Go to previous page"
              onClick={() => onPageChange(currentPage - 1)}
              className={navButtonClassName}
            >
              <ChevronLeftIcon />
              <span>Prev</span>
            </button>
          </li>
        )}
        <li className="md:hidden">
          <GoToPagePopover
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            inputId="pagination-go-to-page-mobile"
            triggerClassName={activePillClassName}
            trigger={
              <span aria-current="page">
                {currentPage} / {totalPages}
              </span>
            }
          />
        </li>
        <li className="hidden md:block">
          <div className="flex flex-wrap items-center gap-2">
            {items.map((item, i) =>
              item === "ellipsis" ? (
                <GoToPagePopover
                  key={`ellipsis-${i}`}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                  inputId={`pagination-go-to-page-e${i}`}
                  triggerClassName={ellipsisButtonClassName}
                  trigger={<span aria-hidden="true">…</span>}
                />
              ) : item === currentPage ? (
                <span
                  key={item}
                  aria-current="page"
                  aria-label={`Current page, page ${item}`}
                  className={activePageButtonClassName}
                >
                  {item}
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-label={`Go to page ${item}`}
                  onClick={() => onPageChange(item)}
                  className={pageButtonClassName}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </li>
        {hasNext && (
          <li>
            <button
              type="button"
              aria-label="Go to next page"
              onClick={() => onPageChange(currentPage + 1)}
              className={navButtonClassName}
            >
              <span>Next</span>
              <ChevronRightIcon />
            </button>
          </li>
        )}
        {hasNext && (
          <li>
            <button
              type="button"
              aria-label="Go to last page"
              onClick={() => onPageChange(totalPages)}
              className={iconButtonClassName}
            >
              <ChevronsRightIcon />
            </button>
          </li>
        )}
        </ul>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {start}–{end} of {totalItems}
      </p>
    </nav>
  );
}

type GoToPagePopoverProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  inputId: string;
  triggerClassName: string;
  trigger: ReactNode;
};

function GoToPagePopover({
  currentPage,
  totalPages,
  onPageChange,
  inputId,
  triggerClassName,
  trigger,
}: GoToPagePopoverProps) {
  const [value, setValue] = useState(String(currentPage));

  const clamp = (target: number) => Math.min(Math.max(target, 1), totalPages);
  const parsed = Number.parseInt(value, 10);
  const atMin = !Number.isFinite(parsed) || parsed <= 1;
  const atMax = !Number.isFinite(parsed) || parsed >= totalPages;

  const goToPage = (close: () => void) => {
    const target = clamp(Number.isFinite(parsed) ? parsed : currentPage);
    onPageChange(target);
    close();
  };

  const stepperButtonClassName =
    "grid w-9 shrink-0 place-items-center text-navy-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/10";

  return (
    <Popover
      label="Go to page"
      trigger={trigger}
      triggerClassName={triggerClassName}
      className="w-max p-4"
      scrollable={false}
      onOpenChange={(open) => {
        if (open) setValue(String(currentPage));
      }}
    >
      {(close) => (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            goToPage(close);
          }}
        >
          <p className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
            Go to page
          </p>
          <div className="flex items-center gap-2">
            <div className="flex h-9 items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-white/15 dark:bg-white/5">
              <button
                type="button"
                aria-label="Decrease page"
                disabled={atMin}
                onClick={() => setValue(String(clamp(parsed - 1)))}
                className={`${stepperButtonClassName} border-r border-slate-200 dark:border-white/10`}
              >
                <MinusIcon />
              </button>
              <input
                id={inputId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
                aria-label="Enter page number"
                className="w-16 bg-transparent text-center font-body text-sm text-navy-800 outline-none focus-visible:ring-0 dark:text-mist-100"
              />
              <button
                type="button"
                aria-label="Increase page"
                disabled={atMax}
                onClick={() => setValue(String(clamp(parsed + 1)))}
                className={`${stepperButtonClassName} border-l border-slate-200 dark:border-white/10`}
              >
                <PlusIcon />
              </button>
            </div>
            <Button type="submit" variant="primary" block={false} className="h-9 px-4">
              Go
            </Button>
          </div>
        </form>
      )}
    </Popover>
  );
}
