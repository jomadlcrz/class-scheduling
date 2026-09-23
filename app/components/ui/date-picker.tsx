import { Popover } from "@base-ui/react/popover";
import { useEffect, useState, type ReactNode } from "react";
import {
  Calendar,
  formatDisplayDate,
  formatISODate,
  parseISODate,
} from "~/components/ui/calendar";
import { CalendarIcon, CloseIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export type DatePickerProps = {
  id: string;
  label?: string;
  placeholder?: string;
  /** Controlled value as "yyyy-mm-dd" (same wire format as <input type="date">). */
  value?: string;
  /** Uncontrolled initial value; read on submit via the hidden input's `name`. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  hint?: string;
  labelEnd?: ReactNode;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  /** Selectable bounds as "yyyy-mm-dd". */
  min?: string;
  max?: string;
  /** "dropdown" adds month + year selects — the layout for a date of birth. */
  captionLayout?: "label" | "dropdown";
  fromYear?: number;
  toYear?: number;
  /** FormData key; defaults to `id` so it drops into uncontrolled forms. */
  name?: string;
  /** Prevents a picker in a compact dialog from flipping above its field. */
  keepPopoverBelow?: boolean;
};

/**
 * A reusable date picker built from the app's `Popover` primitive and a custom
 * `Calendar` — no external date library. Trigger chrome mirrors `Input`/`Select`
 * (same border, height, focus ring), and a hidden input carries the "yyyy-mm-dd"
 * value so it works both controlled (`value`/`onChange`) and uncontrolled
 * (`defaultValue` + FormData). Pass `captionLayout="dropdown"` for date-of-birth.
 */
export function DatePicker({
  id,
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  required,
  hint,
  labelEnd,
  disabled,
  clearable,
  className,
  min,
  max,
  captionLayout = "label",
  fromYear,
  toYear,
  name,
  keepPopoverBelow = false,
}: DatePickerProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? (value ?? "") : internal;

  const selected = parseISODate(current);
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => startOfMonth(selected ?? new Date()));

  // Re-anchor the visible month on the selection each time the popover opens.
  useEffect(() => {
    if (open) setMonth(startOfMonth(selected ?? new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commit = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const handleSelect = (date: Date) => {
    commit(formatISODate(date));
    setOpen(false);
  };

  const triggerClass =
    "flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left font-body text-sm text-navy-800 outline-none transition-colors duration-150 focus-visible:border-gold-400 focus-visible:ring-2 focus-visible:ring-gold-400 data-popup-open:border-gold-400 data-popup-open:ring-2 data-popup-open:ring-gold-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus-visible:border-gold-400 dark:data-popup-open:border-gold-400 dark:disabled:bg-white/3 dark:disabled:text-slate-500";

  const body = (
    <div className={`relative ${className ?? ""}`.trim()}>
      {/* Hidden value carrier so uncontrolled <form> submits pick this up. */}
      <input type="hidden" id={id} name={name ?? id} value={current} />

      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Popover.Trigger
            disabled={disabled}
            aria-label={label || placeholder || "Choose date"}
            aria-describedby={hint ? `${id}-hint` : undefined}
            className={`${triggerClass} ${clearable && current ? "pr-14" : "pr-9"}`}
          >
            <span className={`flex-1 truncate ${selected ? "" : "text-slate-400 dark:text-slate-500"}`}>
              {selected ? formatDisplayDate(selected) : (placeholder ?? "\u00a0")}
            </span>
          </Popover.Trigger>

          {/* Clear button if clearable and value present */}
          {clearable && current && !disabled && (
            <button
              type="button"
              aria-label="Clear date"
              onClick={(e) => {
                e.stopPropagation();
                commit("");
              }}
              className="absolute right-8 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-mist-100"
            >
              <CloseIcon size={12} />
            </button>
          )}

          {/* Calendar glyph on the right, mirroring the Select trigger's chevron. */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <CalendarIcon />
          </span>
        </div>

        <Popover.Portal>
          <Popover.Positioner
            positionMethod="fixed"
            side="bottom"
            align="start"
            sideOffset={6}
            collisionPadding={8}
            collisionAvoidance={{
              side: keepPopoverBelow ? "shift" : "flip",
              align: "shift",
              fallbackAxisSide: "none",
            }}
            className="z-[120] outline-none"
          >
            <Popover.Popup className="rounded-lg border border-slate-200 bg-white shadow-[0_0_0_1px_#d1d9e080,0_6px_12px_-3px_#25292e0a,0_6px_18px_0_#25292e1f] outline-none dark:border-white/10 dark:bg-surface-raised dark:shadow-[0_0_0_1px_#ffffff14,0_6px_12px_-3px_#0000005c,0_6px_18px_0_#00000080]">
              <Calendar
                selected={selected}
                onSelect={handleSelect}
                month={month}
                onMonthChange={setMonth}
                minDate={minDate}
                maxDate={maxDate}
                captionLayout={captionLayout}
                fromYear={fromYear}
                toYear={toYear}
                autoFocus
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );

  if (label) {
    return (
      <FieldChrome id={id} label={label} labelEnd={labelEnd} hint={hint} required={required}>
        {body}
      </FieldChrome>
    );
  }

  return body;
}

export type FilterDatePickerProps = {
  id?: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  clearable?: boolean;
};

/**
 * Filter-bar button variant of DatePicker that mirrors `FilterDropdown` styling.
 * Displays `Label` when empty or `Label: Aug 25, 2026` with active pill tone when selected.
 */
export function FilterDatePicker({
  id,
  label,
  value = "",
  onChange,
  min,
  max,
  clearable = true,
}: FilterDatePickerProps) {
  const isActive = Boolean(value);
  const selected = parseISODate(value);
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => startOfMonth(selected ?? new Date()));

  useEffect(() => {
    if (open) setMonth(startOfMonth(selected ?? new Date()));
  }, [open]);

  const handleSelect = (date: Date) => {
    onChange(formatISODate(date));
    setOpen(false);
  };

  return (
    <div className="relative flex min-w-0">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          id={id}
          aria-label={isActive && selected ? `${label}: ${formatDisplayDate(selected)}` : label}
          className={`flex min-w-0 cursor-pointer items-center gap-1.5 rounded-lg border font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
            isActive && clearable ? "py-2 pl-3 pr-7" : "px-3 py-2"
          } ${
            isActive
              ? "border-blue-700 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:bg-blue-400/15"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 data-popup-open:border-gold-400 data-popup-open:ring-2 data-popup-open:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:data-popup-open:border-gold-400"
          }`}
        >
          <span className="min-w-0 truncate">
            {isActive && selected ? `${label}: ${formatDisplayDate(selected)}` : label}
          </span>
          <CalendarIcon />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner
            positionMethod="fixed"
            side="bottom"
            align="start"
            sideOffset={6}
            collisionPadding={8}
            collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "none" }}
            className="z-[120] outline-none"
          >
            <Popover.Popup className="rounded-lg border border-slate-200 bg-white shadow-[0_0_0_1px_#d1d9e080,0_6px_12px_-3px_#25292e0a,0_6px_18px_0_#25292e1f] outline-none dark:border-white/10 dark:bg-surface-raised dark:shadow-[0_0_0_1px_#ffffff14,0_6px_12px_-3px_#0000005c,0_6px_18px_0_#00000080]">
              <Calendar
                selected={selected}
                onSelect={handleSelect}
                month={month}
                onMonthChange={setMonth}
                minDate={minDate}
                maxDate={maxDate}
                autoFocus
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {clearable && isActive && (
        <button
          type="button"
          aria-label={`Clear ${label} filter`}
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-blue-700/70 transition-colors duration-150 hover:bg-blue-700/10 hover:text-blue-700 dark:text-blue-300/70 dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
        >
          <CloseIcon size={12} />
        </button>
      )}
    </div>
  );
}
