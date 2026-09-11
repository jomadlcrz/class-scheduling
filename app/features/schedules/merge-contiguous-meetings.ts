import { DAYS, timeToMinutes, type Schedule } from "~/types/schedule";

/**
 * Show back-to-back meetings of one class as the single block a reader sees.
 *
 * A subject occasionally lands two meetings on the same day with no gap between
 * them — the generator's last-resort compromise when a section has no second
 * free day (BSIT-3E's RIZAL 1 ran 2:30–4:00 and 4:00–5:30 on a Thursday). A
 * student reads that as one 2:30–5:30 class. Two cards with a seam at 4:00 ask
 * where to go at the break, when the answer is nowhere.
 *
 * DISPLAY ONLY. The stored meetings stay two rows on purpose: the save check
 * counts meetings rather than hours, the generator plans in meetings, and every
 * edit, move, amendment and instructor response addresses one meeting by its
 * id. Nothing this returns may be sent back to the backend, and it may only feed
 * read-only views — never a grid with edit, delete, duplicate or select actions,
 * where each card has to be the one row it acts on.
 *
 * Two meetings merge only when nothing but the clock tells them apart: same
 * term, section, subject, day, room, lecture/lab half, delivery mode and
 * instructor, and the first ends exactly when the next begins. A change of room
 * is something a student has to act on, so it keeps the seam. Runs of three or
 * more chain into one block.
 *
 * The block keeps the first meeting's details and runs to the last meeting's
 * end. Its id joins every meeting it covers, so it can never be mistaken for a
 * real schedule id. The result is ordered by day, then start time — the order
 * every consumer already sorts into.
 */
export function mergeContiguousMeetings(schedules: readonly Schedule[]): Schedule[] {
  const ordered = [...schedules].sort(
    (a, b) =>
      DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
      || timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  const blocks: Schedule[] = [];
  /** `${class key}@${minute a block ends}` -> that block's index in `blocks`. */
  const openByEnd = new Map<string, number>();

  for (const meeting of ordered) {
    const key = classKey(meeting);
    const continues = openByEnd.get(`${key}@${timeToMinutes(meeting.startTime)}`);

    if (continues === undefined) {
      blocks.push(meeting);
      openByEnd.set(`${key}@${timeToMinutes(meeting.endTime)}`, blocks.length - 1);
      continue;
    }

    const block = blocks[continues];
    openByEnd.delete(`${key}@${timeToMinutes(block.endTime)}`);
    blocks[continues] = { ...block, id: `${block.id}+${meeting.id}`, endTime: meeting.endTime };
    openByEnd.set(`${key}@${timeToMinutes(meeting.endTime)}`, continues);
  }

  return blocks;
}

/** Everything that has to match for two meetings to be one continuous class. */
function classKey(meeting: Schedule): string {
  return [
    meeting.schoolYear,
    meeting.semester,
    meeting.setId,
    meeting.subjectId,
    meeting.day,
    meeting.roomId,
    meeting.sessionMode,
    meeting.mode,
    meeting.facultyId,
  ].join("|");
}
