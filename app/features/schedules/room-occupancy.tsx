/**
 * How full a class is, against the seats in the room it was given.
 *
 * Always the PAIR — "38 / 45", never a bare headcount. On its own a count
 * tells a reader nothing they can act on; measured against the room it becomes
 * the one question worth asking of a placement, which is whether the section
 * fits. Rendered identically for the instructor, the Dean and the Registrar,
 * so a class cannot appear to be a different size to the person teaching it
 * than to the people who placed it.
 *
 * SILENT WHEN IT DOES NOT KNOW. Capacity is nullable and many rooms have none
 * recorded, so an unknown renders the count alone rather than inventing a
 * denominator; no count at all renders nothing.
 */

type Props = {
  studentCount?: number | null;
  roomCapacity?: number | null;
  /** Drop the "students" wording where the surrounding row already names it. */
  compact?: boolean;
  /**
   * Type size, as a Tailwind class. A prop rather than something a caller
   * appends, because two conflicting size utilities on one element resolve by
   * CSS order rather than by which was written last.
   */
  sizeClassName?: string;
};

export function RoomOccupancy({
  studentCount,
  roomCapacity,
  compact = false,
  sizeClassName = "text-xs",
}: Props) {
  if (studentCount == null) return null;

  const over = roomCapacity != null && studentCount > roomCapacity;
  const label =
    roomCapacity != null
      ? `${studentCount} of ${roomCapacity} seats`
      : `${studentCount} students, room capacity not recorded`;

  return (
    <span
      title={label}
      className={
        over
          ? `inline-flex shrink-0 items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 font-body ${sizeClassName} font-semibold tabular-nums text-rose-700 dark:bg-rose-400/10 dark:text-rose-200`
          : `inline-flex shrink-0 items-center gap-1 font-body ${sizeClassName} tabular-nums text-slate-500 dark:text-slate-400`
      }
    >
      <span className="sr-only">{label}. </span>
      <span aria-hidden="true">
        {studentCount}
        {roomCapacity != null ? ` / ${roomCapacity}` : ""}
        {!compact && roomCapacity == null ? " students" : ""}
      </span>
      {over ? <span aria-hidden="true">over</span> : null}
    </span>
  );
}
