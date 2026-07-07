import { UserSmallIcon } from "~/components/ui/icons";
import { TYPE_STYLES, type ClassEntry, type ClassroomStatus, type TimeSlot } from "./mapping-model";

export function ClassCard({ entry }: { entry: ClassEntry }) {
  const s = TYPE_STYLES[entry.type];
  return (
    <div
      className={`flex h-full flex-col gap-1 rounded-md border-l-[3px] p-2 text-slate-700 transition-transform duration-150 hover:-translate-y-0.5 dark:text-slate-200 ${s.card} ${s.border}`}
    >
      <span className="font-body text-[0.62rem] font-semibold text-slate-400 dark:text-slate-500">
        {entry.startTime} – {entry.endTime}
      </span>
      <span className={`font-body text-sm font-bold leading-tight ${s.code}`}>
        {entry.subjectCode}
      </span>
      <span className="line-clamp-2 font-body text-[0.72rem] leading-snug text-slate-600 dark:text-slate-300">
        {entry.descriptiveTitle}
      </span>
      <div className="mt-auto flex items-center gap-1 font-body text-[0.62rem] text-slate-500 dark:text-slate-500">
        <UserSmallIcon />
        <span>{entry.instructor}</span>
        <span className="mx-0.5 text-slate-300 dark:text-slate-600">|</span>
        <span>{entry.section}</span>
      </div>
    </div>
  );
}

export function FreeCell({ slot }: { slot: TimeSlot }) {
  return (
    <div className="flex h-full min-h-20 flex-col items-center justify-center gap-1">
      <span className="font-body text-[0.62rem] font-semibold text-slate-400 dark:text-slate-500">
        {slot.start} – {slot.end}
      </span>
      <span className="font-body text-[0.72rem] italic text-slate-300 dark:text-slate-600">
        Free
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: ClassroomStatus }) {
  return status === "available" ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-body text-xs font-semibold text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300">
      Available
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-body text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
      Full
    </span>
  );
}
