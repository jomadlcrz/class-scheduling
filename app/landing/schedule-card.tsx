import { motion, useReducedMotion } from "motion/react";
import { popIn, staggerContainer } from "./motion";

interface ClassBlock {
  id: string;
  title: string;
  room: string;
  /** Grid column = weekday (1-5). */
  day: number;
  /** Row start / span in 30-min-ish units within the visible window. */
  start: number;
  span: number;
  tone: "gold" | "navy" | "blue";
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

const BLOCKS: readonly ClassBlock[] = [
  { id: "cs", title: "Data Structures", room: "CITE 204", day: 1, start: 1, span: 2, tone: "navy" },
  { id: "acct", title: "Accounting I", room: "CBA 110", day: 2, start: 2, span: 2, tone: "gold" },
  { id: "comm", title: "Media Writing", room: "COC 301", day: 3, start: 1, span: 2, tone: "blue" },
  { id: "ped", title: "Teaching Methods", room: "COED 215", day: 4, start: 3, span: 2, tone: "gold" },
  { id: "algo", title: "Algorithms", room: "CITE 204", day: 5, start: 2, span: 3, tone: "navy" },
];

const TONE_STYLES: Record<ClassBlock["tone"], string> = {
  gold: "bg-gold-400/15 border-gold-400/45",
  navy: "bg-navy-500/15 border-navy-500/45",
  blue: "bg-navy-300/15 border-navy-300/45",
};

/** The glassmorphic weekly-schedule preview — the page's centerpiece. */
export function ScheduleCard() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { rotateX: 3, rotateY: -3 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      style={{ transformPerspective: 1000 }}
      className="w-full min-w-0 max-w-sm sm:max-w-md lg:max-w-lg transform-3d"
    >
      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/95 p-3 sm:p-4 lg:p-5 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-navy-800/90 dark:shadow-black/40">
        <header className="mb-2 sm:mb-3 lg:mb-4 flex items-center justify-between">
          <div>
            <p className="font-display text-lg sm:text-xl lg:text-2xl tracking-wide text-navy-700 dark:text-white">
              Spring Term
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Week 6 &middot; No conflicts
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400/15 px-3 py-1 text-xs font-medium text-gold-600 dark:text-gold-300">
            <span className="size-1.5 rounded-full bg-gold-400" />
            Live
          </span>
        </header>

        {/* Weekday header */}
        <div className="mb-2 grid grid-cols-5 gap-1 sm:gap-1.5">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[0.6rem] sm:text-[0.65rem] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Timetable grid with positioned class blocks */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-5 grid-rows-5 gap-1 sm:gap-1.5 h-40 sm:h-48 lg:h-60"
        >
          {BLOCKS.map((block) => (
            <motion.div
              key={block.id}
              variants={popIn}
              style={{
                gridColumnStart: block.day,
                gridRowStart: block.start,
                gridRowEnd: `span ${block.span}`,
              }}
              className={`flex flex-col justify-between overflow-hidden rounded-lg sm:rounded-xl border p-1 sm:p-1.5 lg:p-2 ${TONE_STYLES[block.tone]}`}
            >
              <span className="overflow-hidden wrap-break-word text-[0.65rem] font-semibold leading-tight text-navy-700 dark:text-gold-400">
                {block.title}
              </span>
              <span className="truncate text-[0.55rem] text-slate-500 dark:text-slate-300">
                {block.room}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
