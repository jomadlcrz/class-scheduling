import { useEffect, useState } from "react";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

/**
 * Slices an already-filtered array into pages.
 * Pass a `resetKey` derived from your filter state — the page resets to 1
 * whenever that value changes (compared with Object.is).
 */
export function usePagination<T>(items: T[], resetKey?: unknown) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);

  useEffect(() => {
    setPage(1);
  // resetKey is intentionally the only dep; we want a reset on value change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
    /** 1-based index of the first item on the current page. */
    rangeStart: totalItems === 0 ? 0 : start + 1,
    /** 1-based index of the last item on the current page. */
    rangeEnd: Math.min(start + pageSize, totalItems),
  };
}
