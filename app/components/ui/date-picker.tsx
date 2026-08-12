import { Popover } from "@base-ui/react/popover";
import { useEffect, useState, type ReactNode } from "react";
import {
  Calendar,
  formatDisplayDate,
  formatISODate,
  parseISODate,
} from "~/components/ui/calendar";
import { CalendarIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

type DatePickerProps = {
  id: string;
  label: string;
  /** Controlled value as "yyyy-mm-dd" (same wire format as <input type="date">). */
  value?: string;
  /** Uncontrolled initial value; read on submit via the hidden input's `name`. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  hint?: string;
  labelEnd?: ReactNode;
  disabled?: boolean;
  /** Selectable bounds as "yyyy-mm-dd". */
  min?: string;
  max?: string;
  /** "dropdown" adds month + year selects — the layout for a date of birth. */
  captionLayout?: "label" | "dropdown";
  fromYear?: number;
  toYear?: number;
  /** FormData key; defaults to `id` so it drops into uncontrolled forms. */
  name?: string;
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
  value,
  defaultValue,
  onChange,
  required,
  hint,
  labelEnd,
  disabled,
  min,
  max,
  captionLayout = "label",
  fromYear,
  toYear,
  name,
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

  return (
    <FieldChrome id={id} label={label} labelEnd={labelEnd} hint={hint} required={required}>
      {/* Hidden value carrier so uncontrolled <form> submits pick this up. */}
      <input type="hidden" id={id} name={name ?? id} value={current} />

      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Popover.Trigger
            disabled={disabled}
            aria-describedby={hint ? `${id}-hint` : undefined}
            className={`${triggerClass} pr-10`}
          >
            <span className={`flex-1 truncate ${selected ? "" : "text-slate-400 dark:text-slate-500"}`}>
              {selected ? formatDisplayDate(selected) : "\u00a0"}
            </span>
          </Popover.Trigger>

          {/* Calendar glyph on the right, mirroring the Select trigger's chevron. */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <CalendarIcon />
          </span>
        </div>

        <Popover.Portal>
          <Popover.Positioner
            // `fixed` anchors to the viewport so opening the calendar near the
            // page bottom doesn't extend the document, add a scrollbar, and
            // shift the layout sideways (the default `absolute` strategy does).
            positionMethod="fixed"
            side="bottom"
            align="start"
            sideOffset={6}
            collisionPadding={8}
            // Inside a modal/drawer's scroll container the tall calendar can't
            // fit below the field; keep it flipping bottom↔top and shifting
            // rather than bailing out to a perpendicular side (far-right popup).
            collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "none" }}
            className="z-70 outline-none"
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
    </FieldChrome>
  );
}
