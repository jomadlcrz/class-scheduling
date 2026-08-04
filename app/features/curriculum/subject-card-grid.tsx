import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArchiveIcon, EditIcon } from "~/components/ui/icons";
import { archiveActionButtonClassName } from "~/features/archive/archive-icon-styles";
import type { Subject } from "~/types/subject";

type SubjectCardGridProps = {
  subjects: Subject[];
  /** Manage mode: per-card actions render when both are supplied (omit for read-only views, e.g. the dean's). */
  onEdit?: (subject: Subject) => void;
  onArchive?: (subject: Subject) => void;
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const cardActionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

/** Per-subject cards for a semester: the unit count reads like a credit stamp. */
export function SubjectCardGrid({ subjects, onEdit, onArchive }: SubjectCardGridProps) {
  const reduceMotion = useReducedMotion();
  const manageable = Boolean(onEdit || onArchive);

  if (subjects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 py-6 text-center font-body text-sm text-slate-400 dark:border-white/15 dark:text-slate-500">
        No subjects assigned.
      </div>
    );
  }

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.035, delayChildren: reduceMotion ? 0 : 0.02 },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT } },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={container} className="flex flex-col gap-2">
      {subjects.map((subject) => (
        <motion.div
          key={subject.id}
          variants={item}
          className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
        >
          <div className="min-w-0">
            <p className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
              {subject.code}
            </p>
            <p className="mt-0.5 truncate font-body text-sm text-slate-600 dark:text-slate-300">
              {subject.title}
            </p>
            {subject.prerequisites.length > 0 && (
              <div className="mt-1.5">
                <span className="font-body text-xs text-slate-400 dark:text-slate-500">
                  Requires {subject.prerequisites.join(", ")}
                </span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {manageable && (
              <div className="flex items-center gap-0.5">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(subject)}
                    aria-label={`Edit ${subject.code}`}
                    title="Edit"
                    className={cardActionButtonClassName}
                  >
                    <EditIcon />
                  </button>
                )}
                {onArchive && (
                  <button
                    type="button"
                    onClick={() => onArchive(subject)}
                    aria-label={`Archive ${subject.code}`}
                    title="Archive"
                    className={archiveActionButtonClassName}
                  >
                    <ArchiveIcon />
                  </button>
                )}
              </div>
            )}
            <div className="text-right">
              <p className="font-display text-2xl tabular-nums text-navy-700 dark:text-mist-100">
                {subject.units}
              </p>
              <p className="font-body text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                units
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
