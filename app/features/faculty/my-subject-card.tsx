import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { MapPinIcon, UsersRoundIcon } from "~/components/ui/icons";
import { ModeBadge } from "~/features/schedules/mode-badge";
import { formatSectionSetName } from "~/features/schedules/scheduling-routes";
import { timeToMinutes } from "~/lib/time";
import { SUBJECT_TYPE_LABELS, SUBJECT_TYPE_TONES } from "~/types/subject";
import type { InstructorAssignedSubject, InstructorSubjectSession } from "~/types/instructor-load";

const WEEK_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dayRank(day: string | null): number {
  const index = WEEK_ORDER.indexOf(day ?? "");
  return index === -1 ? WEEK_ORDER.length : index;
}

type DayGroup = { day: string | null; sessions: InstructorSubjectSession[] };

function groupByDay(sessions: InstructorSubjectSession[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const session of sessions) {
    const key = session.day ?? "";
    const group = groups.get(key) ?? { day: session.day, sessions: [] };
    group.sessions.push(session);
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((a, b) => dayRank(a.day) - dayRank(b.day))
    .map((group) => ({
      ...group,
      sessions: [...group.sessions].sort(
        (a, b) => timeToMinutes(a.startTime ?? "") - timeToMinutes(b.startTime ?? ""),
      ),
    }));
}

function hoursBreakdown(subject: InstructorAssignedSubject): string | null {
  const parts: string[] = [];
  if (subject.lecHours > 0) parts.push(`${subject.lecHours} lec`);
  if (subject.labHours > 0) parts.push(`${subject.labHours} lab`);
  return parts.length > 1 ? parts.join(" + ") : null;
}

function sessionSectionName(session: InstructorSubjectSession): string | null {
  return session.setCode && session.program && session.yearLevel != null
    ? formatSectionSetName(session.program, session.yearLevel, session.setCode)
    : session.setCode;
}

function Occupancy({ session }: { session: InstructorSubjectSession }) {
  const { numberOfStudents: students, roomCapacity: capacity } = session;
  const over = capacity != null && students > capacity;

  return (
    <span
      className={`tabular-nums ${over ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300"}`}
      title={over ? `${students - capacity} students over capacity` : undefined}
    >
      {students}
      {capacity != null && (
        <span className={over ? "" : "text-slate-400 dark:text-slate-500"}>
          {" / "}
          {capacity}
        </span>
      )}
    </span>
  );
}

export function MySubjectCard({ subject }: { subject: InstructorAssignedSubject }) {
  const dayGroups = groupByDay(subject.sessions);
  const breakdown = hoursBreakdown(subject);
  const typeTone: BadgeTone = (subject.subjectType ? SUBJECT_TYPE_TONES[subject.subjectType] : undefined) ?? "slate";
  const typeLabel = (subject.subjectType ? SUBJECT_TYPE_LABELS[subject.subjectType] : undefined) ?? subject.subjectType ?? "Subject";

  return (
    <Card className="overflow-hidden p-0 shadow-xs dark:border-white/10 dark:bg-surface-raised">
      <div className="border-b border-slate-200 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl tracking-wide text-navy-800 dark:text-mist-100">
                {subject.subjectCode}
              </h3>
              <Badge tone={typeTone}>{typeLabel}</Badge>
              {subject.programAbbrev && (
                <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                  {subject.programAbbrev}
                </span>
              )}
            </div>
            <p className="font-body text-sm text-slate-600 dark:text-slate-300">{subject.descriptiveTitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-body text-xs dark:border-white/10 dark:bg-white/5">
              <span className="font-medium text-slate-500 dark:text-slate-400">Units:</span>
              <span className="font-semibold text-navy-800 dark:text-mist-100">{subject.units}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-body text-xs dark:border-white/10 dark:bg-white/5">
              <span className="font-medium text-slate-500 dark:text-slate-400">Weekly Hours:</span>
              <span className="font-semibold text-navy-800 dark:text-mist-100">
                {subject.expectedWeeklyHours} {breakdown ? `(${breakdown})` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {subject.sessions.length === 0 ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 p-4 dark:border-white/10">
            <span className="font-body text-sm text-slate-500 dark:text-slate-400">
              Assigned to your load, awaiting schedule placement.
            </span>
            <Badge tone="gold">Awaiting schedule</Badge>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Scheduled Classes ({subject.sessions.length} session{subject.sessions.length === 1 ? "" : "s"})
              </h4>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-white/5 dark:border-white/10">
              {dayGroups.map((group) => (
                <div key={group.day ?? "unscheduled"} className="flex flex-col p-3.5 sm:flex-row sm:items-start sm:gap-4">
                  <div className="w-28 shrink-0">
                    <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                      {group.day ?? "Unspecified"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2.5">
                    {group.sessions.map((session, sIdx) => {
                      const secName = sessionSectionName(session);
                      return (
                        <div
                          key={session.regularSchedId ?? `${group.day}-${sIdx}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50/80 px-3 py-2 text-xs dark:bg-white/3"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-body font-medium tabular-nums text-navy-800 dark:text-mist-100">
                              {session.startTime && session.endTime
                                ? `${session.startTime} – ${session.endTime}`
                                : "Time TBA"}
                            </span>

                            {secName && (
                              <span className="rounded bg-slate-200/70 px-1.5 py-0.5 font-body font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                {secName}
                              </span>
                            )}

                            {session.classMode && <ModeBadge mode={session.classMode} />}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon size={13} />
                              <span>{session.room ?? "Room TBA"}</span>
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <UsersRoundIcon />
                              <Occupancy session={session} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
