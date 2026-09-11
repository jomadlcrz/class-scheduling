import { Badge } from "~/components/ui/badge";
import { formatTime12h } from "~/lib/time";
import type { InstructorHoldings } from "~/types/published-amendments";

/** "1 meeting", not "1 meetings" — these counts are usually small. */
function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * The counts and meeting list for what one instructor still holds. Shared by
 * the deactivation warning and the Registrar's vacate action, which show the
 * same facts to two different people.
 */
export function InstructorHoldingsSummary({ holdings }: { holdings: InstructorHoldings }) {
  return (
    <>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone="gold">{plural(holdings.meetingCount, "meeting")}</Badge>
        <Badge tone="slate">{plural(holdings.sectionCount, "section")}</Badge>
        <Badge tone="slate">{plural(holdings.subjectCount, "subject")}</Badge>
        <Badge tone="slate">{holdings.weeklyHours} hrs / week</Badge>
      </div>
      <ul className="mt-2 grid max-h-32 gap-0.5 overflow-y-auto pr-1">
        {holdings.meetings.map((meeting) => (
          <li
            key={meeting.scheduleId}
            className="font-body text-[11px] leading-relaxed text-slate-500 dark:text-slate-400"
          >
            {meeting.subjectCode} · {meeting.setName} · {meeting.dayOfWeek}
            {meeting.startTime && meeting.endTime
              ? ` ${formatTime12h(meeting.startTime)}–${formatTime12h(meeting.endTime)}`
              : ""}
          </li>
        ))}
      </ul>
    </>
  );
}
