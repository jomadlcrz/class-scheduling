import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { FormError } from "~/components/forms/form-error";
import { Badge } from "~/components/ui/badge";
import { Drawer } from "~/components/ui/drawer";
import { ChevronDownIcon, ChevronRightIcon } from "~/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  dayHoursLabel,
  dayHoursTitle,
  fullDays,
  hoursLabel,
  roomHoursLabel,
  shortDays,
  sortInstructors,
  sortRooms,
} from "~/features/schedules/major-availability-logic";
import { formatTime12h, timeToMinutes } from "~/lib/time";
import { majorSchedulingAvailabilityService } from "~/services/major-scheduling-availability.service";
import type {
  AvailabilityBusy,
  AvailabilityHours,
  AvailabilityInstructor,
  AvailabilityRoom,
  AvailabilityRoomDay,
  MajorAvailabilityWorkspace,
  MajorSchedulingAvailability,
  MajorSchedulingAvailabilityQuery,
} from "~/types/major-scheduling-availability";

/**
 * What the room map behind this drawer cannot say.
 *
 * That map draws only the Dean's OWN department, so a room another
 * department's live timetable already holds appears free, and nothing on the
 * page says whether an instructor is at their cap — the backend accepts both
 * and the collision surfaces at Registrar finalize. See
 * MajorSchedulingAvailabilityService for why the scope is what it is.
 *
 * Two readings in one panel, because the Dean needs both at different moments:
 *
 *   * with no slot selected it is a WEEK BROWSER — every eligible room and
 *     every instructor, their free windows and remaining hours, which is what
 *     you want before choosing where to put anything;
 *   * with a slot selected it adds the VERDICT for that slot, sorting whoever
 *     is free to the top and saying what is in the way of everyone else.
 *
 * Fetching is keyed on the query, so picking a cell or changing the program
 * re-reads. Deliberately uncached — a Dean building a submission changes this
 * with every save, and a stale answer here is a double-booking.
 */

type Tab = "rooms" | "instructors";

function windowLabel(startTime: string, endTime: string) {
  return `${formatTime12h(startTime)}–${formatTime12h(endTime)}`;
}

/**
 * One day as a proportional bar: busy blocks against the operating window.
 *
 * A list of times is what the page already shows everywhere else; the point of
 * a bar is that "free at 07:00 but nothing after" and "free all afternoon"
 * stop looking alike, which is the judgment the Dean is actually making.
 */
function DayBar({
  busy,
  windowStart,
  windowEnd,
  lunch,
}: {
  busy: AvailabilityBusy[];
  windowStart: number;
  windowEnd: number;
  lunch: { startTime: string; endTime: string };
}) {
  const span = windowEnd - windowStart;
  if (span <= 0) return null;
  // Clamped, because a booking is not obliged to lie inside the operating day.
  const percent = (minutes: number) =>
    ((Math.min(Math.max(minutes, windowStart), windowEnd) - windowStart) / span) * 100;
  const widthPercent = (start: number, end: number) =>
    Math.max(0, percent(end) - percent(start));
  const lunchStart = timeToMinutes(lunch.startTime);
  const lunchEnd = timeToMinutes(lunch.endTime);

  return (
    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-400/15">
      {/* The break is shaded, never subtracted */}
      <div
        className="absolute inset-y-0 bg-slate-200/70 dark:bg-white/10"
        style={{
          left: `${percent(lunchStart)}%`,
          width: `${widthPercent(lunchStart, lunchEnd)}%`,
        }}
      />
      {busy.map((entry) => {
        const start = timeToMinutes(entry.startTime);
        const end = timeToMinutes(entry.endTime);
        return (
          <div
            key={`${entry.startTime}-${entry.endTime}-${entry.label}`}
            title={`${entry.label} · ${windowLabel(entry.startTime, entry.endTime)}`}
            className={
              entry.source === "committed"
                ? "absolute inset-y-0 bg-slate-500 dark:bg-slate-400"
                : "absolute inset-y-0 bg-blue-500 dark:bg-blue-400"
            }
            style={{
              left: `${percent(start)}%`,
              width: `${widthPercent(start, end)}%`,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * One resource's week, spelled out.
 */
function WeekStrip({
  byDay,
  dayWindow,
  highlightDay,
}: {
  byDay: (AvailabilityRoomDay & { hours?: AvailabilityHours })[];
  dayWindow: MajorSchedulingAvailability["dayWindow"];
  highlightDay?: string | null;
}) {
  const windowStart = timeToMinutes(dayWindow.startTime);
  const windowEnd = timeToMinutes(dayWindow.endTime);
  const operatingHours = (windowEnd - windowStart) / 60;
  return (
    <div className="grid gap-2">
      {byDay.map((day) => (
        <div
          key={day.day}
          className={`rounded-md px-2 py-1.5 ${
            highlightDay === day.day
              ? "bg-amber-100/70 ring-1 ring-amber-300 dark:bg-gold-400/10 dark:ring-gold-400/30"
              : day.free.length === 0
                ? "bg-red-50 ring-1 ring-red-200 dark:bg-red-400/10 dark:ring-red-400/25"
                : "bg-slate-50 dark:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-8 shrink-0 font-body text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {day.day.slice(0, 3)}
            </span>
            <DayBar
              busy={day.busy}
              windowStart={windowStart}
              windowEnd={windowEnd}
              lunch={dayWindow.lunch}
            />
            <span
              title={
                day.hours
                  ? dayHoursTitle(day.hours, operatingHours)
                  : `${hoursLabel(operatingHours - day.freeHours)} held of the ${hoursLabel(operatingHours)} operating day`
              }
              className={`shrink-0 text-right font-body text-[10px] font-bold tabular-nums ${
                day.free.length === 0
                  ? "text-red-700 dark:text-red-400"
                  : day.freeHours < 2
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {day.hours
                ? dayHoursLabel(day.hours, operatingHours)
                : roomHoursLabel(day.freeHours, operatingHours)}
            </span>
          </div>

          <dl className="mt-1 grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-1.5 gap-y-0.5 pl-0">
            <dt className="font-body text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Free
            </dt>
            <dd className="font-body text-[11px] leading-snug text-slate-700 dark:text-slate-200">
              {day.free.length === 0 ? (
                <span className="text-slate-400 dark:text-slate-500">
                  Nothing left this day
                </span>
              ) : (
                day.free
                  .map((w) => windowLabel(w.startTime, w.endTime))
                  .join("  ·  ")
              )}
            </dd>
            {day.busy.length > 0 ? (
              <>
                <dt className="font-body text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Busy
                </dt>
                <dd className="grid gap-0.5">
                  {day.busy.map((entry) => (
                    <span
                      key={`${entry.startTime}-${entry.label}`}
                      className="font-body text-[11px] leading-snug text-slate-500 dark:text-slate-400"
                    >
                      {windowLabel(entry.startTime, entry.endTime)} ·{" "}
                      <span
                        className={
                          entry.source === "draft"
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-600 dark:text-slate-300"
                        }
                      >
                        {entry.label}
                      </span>
                    </span>
                  ))}
                </dd>
              </>
            ) : null}
          </dl>
        </div>
      ))}
    </div>
  );
}

function BlockedList({ blockedBy }: { blockedBy: AvailabilityBusy[] }) {
  return (
    <ul className="mt-1.5 grid gap-1">
      {blockedBy.map((entry) => (
        <li
          key={`${entry.startTime}-${entry.label}`}
          className="font-body text-[11px] leading-relaxed text-slate-600 dark:text-slate-300"
        >
          <span className="font-semibold">{entry.label}</span>{" "}
          {windowLabel(entry.startTime, entry.endTime)}
          <span className="text-slate-400 dark:text-slate-500">
            {entry.source === "draft" ? " · this build" : " · timetable"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ExpandableRow({
  title,
  subtitle,
  badges,
  children,
  detail,
}: {
  title: string;
  subtitle?: string;
  badges: React.ReactNode;
  children?: React.ReactNode;
  detail: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="py-2.5 first:pt-1">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-start justify-between gap-2 text-left"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-1">
            <span className="shrink-0 text-slate-400 dark:text-slate-500">
              {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </span>
            <span className="truncate font-body text-xs font-bold text-navy-800 dark:text-white">
              {title}
            </span>
          </span>
          {subtitle ? (
            <span className="mt-0.5 block pl-4.5 font-body text-[11px] text-slate-500 dark:text-slate-400">
              {subtitle}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {badges}
        </span>
      </button>
      {children ? <div className="mt-1.5 pl-4.5">{children}</div> : null}
      {open ? <div className="mt-2 pl-4.5">{detail}</div> : null}
    </section>
  );
}

export function MajorAvailabilityDrawer({
  open,
  onClose,
  query,
  contextLabel,
  elevated,
}: {
  open: boolean;
  onClose: () => void;
  elevated?: boolean;
  query: MajorSchedulingAvailabilityQuery | null;
  contextLabel?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("rooms");
  const [programOverride, setProgramOverride] = useState<number | null>(null);
  const [onlyAtCap, setOnlyAtCap] = useState(false);
  const [data, setData] = useState<MajorSchedulingAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryKey = query
    ? JSON.stringify(
        programOverride == null ? query : { ...query, programId: programOverride },
      )
    : null;

  useEffect(() => {
    if (query?.programId) setProgramOverride(null);
  }, [query?.programId]);

  useEffect(() => {
    if (!open || !queryKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    majorSchedulingAvailabilityService
      .get(JSON.parse(queryKey) as MajorSchedulingAvailabilityQuery)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setError(
          err instanceof Error ? err.message : "Unable to load availability.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, queryKey]);

  const slot = data?.slot ?? null;

  const rooms = useMemo(
    () => (data ? sortRooms(data.rooms, slot != null) : []),
    [data, slot],
  );

  const instructors = useMemo(
    () => (data ? sortInstructors(data.instructors, slot != null) : []),
    [data, slot],
  );

  const visibleInstructors = useMemo(
    () =>
      onlyAtCap
        ? instructors.filter((person) => {
            return fullDays(person).length > 0 || person.weekly.remaining <= 0;
          })
        : instructors,
    [instructors, onlyAtCap],
  );

  const summary = useMemo(() => {
    if (!data) return null;
    return {
      instructorsFullyBooked: data.instructors.filter(
        (person) =>
          person.weekly.remaining <= 0 ||
          person.byDay.some((day) => day.free.length === 0),
      ).length,
    };
  }, [data]);

  const freeRoomCount = slot
    ? rooms.filter((room) => room.freeForSlot).length
    : null;
  const availableInstructorCount = slot
    ? instructors.filter(
        (person) => person.freeForSlot && person.fitsCapsForSlot,
      ).length
    : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Availability"
      elevated={elevated}
      description={
        slot
          ? "Rooms and instructors free for the selected slot, and what is holding the rest."
          : "Free rooms and instructor hours for the selected academic term."
      }
      disableBackdropBlur
    >
      <div className="grid gap-3">
        <FormError message={error} />

        {query == null ? (
          <EmptyState title="No academic term selected">
            Choose a school year and semester to see what is free.
          </EmptyState>
        ) : (
          <>
            {slot ? (
              <p className="font-body text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                <span className="font-bold text-navy-800 dark:text-white">
                  {slot.dayOfWeek}, {windowLabel(slot.startTime, slot.endTime)}
                </span>{" "}
                ·{" "}
                {contextLabel ??
                  `${hoursLabel(slot.hours)} — free rooms and instructors are listed first.`}
              </p>
            ) : null}

            {data ? <Legend workspace={data.workspace} /> : null}

            <div className="grid grid-cols-2 divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-300 dark:divide-white/10 dark:border-white/15">
              {(
                [
                  ["rooms", "Rooms", freeRoomCount, rooms.length],
                  ["instructors", "Instructors", availableInstructorCount, visibleInstructors.length],
                ] as [Tab, string, number | null, number][]
              ).map(([value, label, free, total]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  aria-pressed={tab === value}
                  className={`cursor-pointer px-3 py-2 font-body text-xs font-bold transition-colors ${
                    tab === value
                      ? "bg-navy-800 text-white dark:bg-white/15"
                      : "bg-white text-navy-700 hover:bg-slate-100 dark:bg-surface-raised dark:text-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {label}
                  <span
                    className={
                      tab === value
                        ? "ml-1.5 text-white/70"
                        : "ml-1.5 text-slate-500 dark:text-slate-400"
                    }
                  >
                    {free == null ? total : `${free}/${total}`}
                  </span>
                </button>
              ))}
            </div>

            {tab === "instructors" && summary && summary.instructorsFullyBooked > 0 ? (
              <button
                type="button"
                onClick={() => setOnlyAtCap((current) => !current)}
                aria-pressed={onlyAtCap}
                className={`cursor-pointer self-start rounded-full border px-2 py-0.5 font-body text-[11px] font-bold transition-colors ${
                  onlyAtCap
                    ? "border-red-300 bg-red-100 text-red-800 dark:border-red-400/30 dark:bg-red-400/15 dark:text-red-200"
                    : "border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300 dark:hover:bg-gold-400/20"
                }`}
              >
                {summary.instructorsFullyBooked} with no time left
                {onlyAtCap ? " — showing only these" : ""}
              </button>
            ) : null}

            {loading ? (
              <p className="py-6 text-center font-body text-xs text-slate-500 dark:text-slate-400">
                Loading availability…
              </p>
            ) : data == null ? null : tab === "rooms" ? (
              <>
                {data.programs.length > 1 ? (
                  <div className="grid gap-1">
                    <span className="font-body text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Room access for
                    </span>
                    <Select
                      items={[
                        {
                          value: "",
                          label: `Any of my programs (${data.programs.length})`,
                        },
                        ...data.programs.map((program) => ({
                          value: String(program.programId),
                          label: `${program.programAbbrev} — ${program.programName}`,
                        })),
                      ]}
                      value={data.programId == null ? "" : String(data.programId)}
                      onValueChange={(next) =>
                        setProgramOverride(next ? Number(next) : null)
                      }
                    >
                      <SelectTrigger
                        aria-label="Room access for program"
                        className="h-8 text-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          Any of my programs ({data.programs.length})
                        </SelectItem>
                        {data.programs.map((program) => (
                          <SelectItem
                            key={program.programId}
                            value={String(program.programId)}
                          >
                            {program.programAbbrev} — {program.programName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <RoomList rooms={rooms} data={data} />
              </>
            ) : (
              <InstructorList
                instructors={visibleInstructors}
                data={data}
                emptyTitle={
                  onlyAtCap
                    ? "Everyone still has time free"
                    : "No instructors for this term"
                }
                emptyBody={
                  onlyAtCap
                    ? "Every instructor has an open window left in every day, and hours left in the week."
                    : "No active instructor here has a teaching term for this term yet."
                }
              />
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}

function RoomList({
  rooms,
  data,
}: {
  rooms: AvailabilityRoom[];
  data: MajorSchedulingAvailability;
}) {
  if (rooms.length === 0) {
    return (
      <EmptyState title="No rooms open to this program">
        Room access is set per program by the Registrar, in Facilities. A
        program with no rooms listed there can hold no face-to-face class.
      </EmptyState>
    );
  }
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
      {rooms.map((room) => (
        <ExpandableRow
          key={room.id}
          title={room.name}
          subtitle={`${room.buildingName} · ${room.type}${
            room.capacity != null ? ` · ${room.capacity} seats` : ""
          }${
            data.programId == null && room.allowedPrograms.length > 0
              ? ` · ${room.allowedPrograms.map((p) => p.programAbbrev).join(", ")}`
              : ""
          }`}
          badges={
            <>
              {room.freeForSlot === true ? (
                <Badge tone="emerald">Free</Badge>
              ) : room.freeForSlot === false ? (
                <Badge tone="red">Occupied</Badge>
              ) : null}
              <Badge tone="slate">{hoursLabel(room.freeHours)} free</Badge>
            </>
          }
          detail={
            <WeekStrip
              byDay={room.byDay}
              dayWindow={data.dayWindow}
              highlightDay={data.slot?.dayOfWeek}
            />
          }
        >
          {room.blockedBy && room.blockedBy.length > 0 ? (
            <BlockedList blockedBy={room.blockedBy} />
          ) : null}
        </ExpandableRow>
      ))}
    </div>
  );
}

function InstructorList({
  instructors,
  data,
  emptyTitle,
  emptyBody,
}: {
  instructors: AvailabilityInstructor[];
  data: MajorSchedulingAvailability;
  emptyTitle: string;
  emptyBody: string;
}) {
  if (instructors.length === 0) {
    return (
      <EmptyState title={emptyTitle}>{emptyBody}</EmptyState>
    );
  }
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
      {instructors.map((person) => {
        const full = fullDays(person);
        return (
          <ExpandableRow
            key={person.instructorProfileId}
            title={person.name}
            subtitle={`${
              data.departmentId == null ? `${person.departmentAbbrev} · ` : ""
            }${person.weekly.assigned} of ${person.weekly.cap} weekly hrs${
              person.weekly.draft > 0
                ? person.weekly.draft === person.weekly.assigned
                  ? " · all from this build"
                  : ` · ${hoursLabel(person.weekly.draft)} from this build`
                : ""
            }`}
            badges={
              <>
                {person.assignedToSubject === true ? (
                  <Badge tone="blue">Assigned</Badge>
                ) : null}
                {person.freeForSlot === true ? (
                  <Badge tone="emerald">Free</Badge>
                ) : person.freeForSlot === false ? (
                  <Badge tone="red">Teaching</Badge>
                ) : null}
                {person.fitsCapsForSlot === false ? (
                  <Badge tone="gold">Slot exceeds cap</Badge>
                ) : null}
                {full.length > 0 ? (
                  <Badge tone="red">Day full · {shortDays(full)}</Badge>
                ) : null}
                <Badge tone={person.weekly.remaining <= 0 ? "red" : "slate"}>
                  {hoursLabel(Math.max(0, person.weekly.remaining))} left this week
                </Badge>
              </>
            }
            detail={
              <WeekStrip
                byDay={person.byDay}
                dayWindow={data.dayWindow}
                highlightDay={data.slot?.dayOfWeek}
              />
            }
          >
            {person.blockedBy && person.blockedBy.length > 0 ? (
              <BlockedList blockedBy={person.blockedBy} />
            ) : null}
            {person.capWarnings.length > 0 ? (
              <ul className="mt-1.5 grid gap-1">
                {person.capWarnings.map((warning) => (
                  <li
                    key={warning}
                    className="font-body text-[11px] leading-relaxed text-amber-700 dark:text-amber-300"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            ) : null}
          </ExpandableRow>
        );
      })}
    </div>
  );
}

function Legend({ workspace }: { workspace: MajorAvailabilityWorkspace }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-body text-[11px] text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 shrink-0 rounded-sm bg-emerald-200 dark:bg-emerald-400/30" />
          Free
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 shrink-0 rounded-sm bg-blue-500 dark:bg-blue-400" />
          {workspace === "registrar" ? "Submitted Major build" : "This build's draft"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 shrink-0 rounded-sm bg-slate-500 dark:bg-slate-400" />
          Committed timetable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 shrink-0 rounded-sm bg-slate-200 dark:bg-white/10" />
          Lunch
        </span>
      </div>
    </div>
  );
}
