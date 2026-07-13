import { UserSmallIcon } from "~/components/ui/icons";
import { formatTime12h } from "~/lib/time";
import { TYPE_STYLES, type ClassEntry, type TimeSlot } from "./mapping-model";

export function ClassCard({ entry, hiddenCount = 0 }: { entry: ClassEntry; hiddenCount?: number }) {
  const s = TYPE_STYLES[entry.type];
  return (
    <div
      className={`flex h-full flex-col gap-1 rounded-md border-l-[3px] p-2 text-slate-700 transition-transform duration-150 hover:-translate-y-0.5 dark:text-slate-200 ${s.card} ${s.border}`}
    >
      <span className="font-body text-[0.62rem] font-semibold text-slate-400 dark:text-slate-500">
        {formatTime12h(entry.startTime)} – {formatTime12h(entry.endTime)}
        {hiddenCount > 0 && (
          <span className="ml-1 rounded bg-slate-200 px-1 font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
            +{hiddenCount} more
          </span>
        )}
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


