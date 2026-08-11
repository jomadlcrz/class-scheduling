import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRightIcon } from "~/components/ui/icons";

/* ── Date helpers (local-time, no external deps) ──────────────────────────
 * Everything is kept in LOCAL time on purpose. `new Date(iso)` and
 * `toISOString()` shift by the timezone offset and can land a birthdate on the
 * wrong day; parsing/formatting by parts avoids that entirely. The wire format
 * is the same "yyyy-mm-dd" a native <input type="date"> emits, so the value
 * drops into the existing schema and FormData flow unchanged.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** Date → "yyyy-mm-dd" in local time. */
export function formatISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "yyyy-mm-dd" → local Date, or null if it isn't a valid calendar date. */
export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  // Reject rolled-over dates like 2001-02-30 (JS would silently make it March 2).
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/** Human-friendly label, e.g. "Jan 5, 2001". */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Six weeks (42 cells) covering the given month, including leading/trailing days. */
function buildGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const gridStart = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export type CalendarProps = {
  /** Currently selected day, or null. */
  selected: Date | null;
  /** Fired when a day is chosen. */
  onSelect: (date: Date) => void;
  /** First-of-month currently shown. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /** Days before `minDate` / after `maxDate` are disabled. */
  minDate?: Date | null;
  maxDate?: Date | null;
  /** "label" shows a static caption; "dropdown" shows month + year selects. */
  captionLayout?: "label" | "dropdown";
  fromYear?: number;
  toYear?: number;
  /** Focus the active day when the calendar mounts (used when a popover opens). */
  autoFocus?: boolean;
};

/**
 * A self-contained month grid. Roving-tabindex keyboard navigation: arrows move
 * by day, PageUp/Down by month, Shift+PageUp/Down by year, Home/End to week
 * edges, Enter/Space to select. The parent owns `month`/`selected` so the
 * component stays controlled and reusable (single date, DOB, future ranges).
 */
export function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  minDate,
  maxDate,
  captionLayout = "label",
  fromYear,
  toYear,
  autoFocus = false,
}: CalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const grid = useMemo(() => buildGrid(month), [month]);

  // The day that owns tabIndex=0. Seeded from selection, else today-in-view, else 1st.
  const initialActive = () => {
    if (selected && selected.getMonth() === month.getMonth() && selected.getFullYear() === month.getFullYear()) {
      return startOfDay(selected);
    }
    if (today.getMonth() === month.getMonth() && today.getFullYear() === month.getFullYear()) return today;
    return startOfMonth(month);
  };
  const [active, setActive] = useState<Date>(initialActive);
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(autoFocus);

  // Keep the active day inside the visible month when the caller changes it.
  useEffect(() => {
    setActive((prev) =>
      prev.getMonth() === month.getMonth() && prev.getFullYear() === month.getFullYear() ? prev : initialActive(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  // Move focus to the active cell after a keyboard move (or on mount if autoFocus).
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    const el = gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${formatISODate(active)}"]`);
    el?.focus();
  }, [active]);

  const isDisabled = (day: Date) =>
    (minDate ? startOfDay(day) < startOfDay(minDate) : false) ||
    (maxDate ? startOfDay(day) > startOfDay(maxDate) : false);

  const moveActive = (next: Date) => {
    pendingFocus.current = true;
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      onMonthChange(startOfMonth(next));
    }
    setActive(startOfDay(next));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(active, -1); break;
      case "ArrowRight": next = addDays(active, 1); break;
      case "ArrowUp": next = addDays(active, -7); break;
      case "ArrowDown": next = addDays(active, 7); break;
      case "Home": next = addDays(active, -active.getDay()); break;
      case "End": next = addDays(active, 6 - active.getDay()); break;
      case "PageUp": next = addMonths(active, e.shiftKey ? -12 : -1); break;
      case "PageDown": next = addMonths(active, e.shiftKey ? 12 : 1); break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!isDisabled(active)) onSelect(active);
        return;
      default: return;
    }
    e.preventDefault();
    moveActive(next);
  };

  const years = useMemo(() => {
    const end = toYear ?? new Date().getFullYear() + 10;
    const start = fromYear ?? 1900;
    const list: number[] = [];
    for (let y = end; y >= start; y--) list.push(y);
    return list;
  }, [fromYear, toYear]);

  // `color-scheme` makes the browser render the NATIVE option popup in the right
  // theme (dark bg + light text) — without it the popup stays white-on-white in
  // dark mode. Explicit option colors cover the browsers that ignore it.
  const captionSelectClass =
    "cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 font-body text-sm text-navy-800 outline-none transition-colors duration-150 [color-scheme:light] hover:border-slate-400 focus-visible:border-gold-400 focus-visible:ring-2 focus-visible:ring-gold-400 [&>option]:bg-white [&>option]:text-navy-800 dark:border-white/15 dark:bg-surface-raised dark:text-mist-100 dark:[color-scheme:dark] dark:[&>option]:bg-surface-raised dark:[&>option]:text-mist-100";

  const navBtnClass =
    "flex h-7 w-7 items-center justify-center rounded-md text-slate-500 outline-none transition-colors duration-150 hover:bg-slate-100 hover:text-navy-800 focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-mist-100";

  return (
    <div className="w-68 select-none p-3 font-body">
      {/* Caption row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          className={navBtnClass}
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          <span className="rotate-180">
            <ChevronRightIcon />
          </span>
        </button>

        {captionLayout === "dropdown" ? (
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Month"
              className={captionSelectClass}
              value={month.getMonth()}
              onChange={(e) => onMonthChange(new Date(month.getFullYear(), Number(e.target.value), 1))}
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
            <select
              aria-label="Year"
              className={captionSelectClass}
              value={month.getFullYear()}
              onChange={(e) => onMonthChange(new Date(Number(e.target.value), month.getMonth(), 1))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        ) : (
          <div aria-live="polite" className="text-sm font-semibold text-navy-800 dark:text-mist-100">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </div>
        )}

        <button
          type="button"
          aria-label="Next month"
          className={navBtnClass}
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <ChevronRightIcon />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>

      {/* Day grid */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div ref={gridRef} role="grid" className="grid grid-cols-7 gap-0.5" onKeyDown={onKeyDown}>
        {grid.map((day) => {
          const outside = day.getMonth() !== month.getMonth();
          const disabled = isDisabled(day);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isToday = isSameDay(day, today);
          const isActive = isSameDay(day, active);

          return (
            <button
              key={formatISODate(day)}
              type="button"
              role="gridcell"
              data-day={formatISODate(day)}
              aria-selected={isSelected}
              aria-current={isToday ? "date" : undefined}
              tabIndex={isActive ? 0 : -1}
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-md text-sm outline-none transition-colors duration-100",
                "focus-visible:ring-2 focus-visible:ring-gold-400",
                disabled ? "cursor-not-allowed text-slate-300 dark:text-slate-600" : "cursor-pointer",
                isSelected
                  ? "bg-gold-400 font-semibold text-navy-900 hover:bg-gold-400"
                  : outside
                    ? "text-slate-400 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-white/10"
                    : "text-navy-800 hover:bg-slate-100 dark:text-mist-100 dark:hover:bg-white/10",
                !isSelected && isToday ? "ring-1 ring-inset ring-gold-400/60" : "",
              ].join(" ")}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
