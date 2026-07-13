import { AnimatePresence, motion } from "motion/react";
import { Badge } from "~/components/ui/badge";
import { DropdownMenu } from "~/components/ui/dropdown";
import { EmptyState } from "~/components/feedback/empty-state";
import { ChevronRightIcon, EditIcon, TrashIcon } from "~/components/ui/icons";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import {
  type CreateSubjectInput,
  type Subject,
} from "~/types/subject";

export type PendingEntry = CreateSubjectInput & { tempId: string };

type StructureRow = {
  key: string;
  code: string;
  title: string;
  units: number;
  subjectType: string;
  /** Prerequisite subject codes. */
  prerequisites: string[];
  /** Set only for unsaved entries — they're highlighted and editable. */
  tempId?: string;
};

type CurriculumStructureProps = {
  program: string;
  /** Saved subjects of the program. */
  saved: Subject[];
  /** Unsaved entries added in this session. */
  pending: PendingEntry[];
  /** Keys of collapsed year/semester sections (see collectSectionKeys). */
  collapsed: ReadonlySet<string>;
  onToggleSection: (key: string) => void;
  onEditPending: (tempId: string) => void;
  onRemovePending: (tempId: string) => void;
};

/** Collapse keys of every year/semester section present in the given rows. */
export function collectSectionKeys(
  saved: Subject[],
  pending: PendingEntry[],
): string[] {
  const keys = new Set<string>();
  for (const row of [...saved, ...pending]) {
    keys.add(`y${row.yearLevel}`);
    keys.add(`y${row.yearLevel}s${row.semester}`);
  }
  return [...keys];
}

const sectionBodyVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
} as const;

/** Year → semester breakdown of a program's curriculum, with unsaved entries highlighted. */
export function CurriculumStructure({
  program,
  saved,
  pending,
  collapsed,
  onToggleSection,
  onEditPending,
  onRemovePending,
}: CurriculumStructureProps) {
  const { semesters, semesterLabel } = useSemesters();
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const rows: (StructureRow & { yearLevel: number; semester: number })[] = [
    ...saved.map((s) => ({ ...s, key: `saved-${s.id}` })),
    ...pending.map((p) => ({ ...p, key: p.tempId, tempId: p.tempId })),
  ];

  if (rows.length === 0) {
    return (
      <EmptyState title="No subjects yet">
        {program} has no curriculum entries. Add subjects using the form.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {yearLevelIds.map((year) => {
        const yearRows = rows.filter((r) => r.yearLevel === year);
        if (yearRows.length === 0) return null;
        const yearUnits = yearRows.reduce((sum, r) => sum + r.units, 0);

        const yearKey = `y${year}`;
        const yearOpen = !collapsed.has(yearKey);

        return (
          <section key={year}>
            <button
              type="button"
              aria-expanded={yearOpen}
              onClick={() => onToggleSection(yearKey)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`text-slate-400 transition-transform duration-200 dark:text-slate-500 ${yearOpen ? "rotate-90" : ""}`}
                >
                  <ChevronRightIcon />
                </span>
                <span className="font-display text-xl tracking-wide text-navy-700 dark:text-white">
                  {yearLevelLabel(year)}
                </span>
              </span>
              <Badge tone="navy">{yearUnits} units</Badge>
            </button>

            <AnimatePresence initial={false}>
              {yearOpen && (
                <motion.div
                  key="year-body"
                  variants={sectionBodyVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <div className="mt-2 flex flex-col gap-3">
                    {semesters.map(({ semesterNumber: semester }) => {
                      const semesterRows = yearRows.filter(
                        (r) => r.semester === semester,
                      );
                      if (semesterRows.length === 0) return null;
                      const semesterUnits = semesterRows.reduce(
                        (sum, r) => sum + r.units,
                        0,
                      );
                      const semesterKey = `y${year}s${semester}`;
                      const semesterOpen = !collapsed.has(semesterKey);

                      return (
                        <div
                          key={semester}
                          className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/80"
                        >
                          <button
                            type="button"
                            aria-expanded={semesterOpen}
                            onClick={() => onToggleSection(semesterKey)}
                            className={`flex w-full cursor-pointer items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 text-left rounded-t-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 dark:bg-navy-800/60 ${
                              semesterOpen
                                ? "border-b border-slate-200 dark:border-white/10"
                                : "rounded-b-xl"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                className={`text-slate-400 transition-transform duration-200 dark:text-slate-500 ${semesterOpen ? "rotate-90" : ""}`}
                              >
                                <ChevronRightIcon />
                              </span>
                              <span className="font-body text-sm font-semibold text-navy-700 dark:text-white">
                                {semesterLabel(semester)}
                              </span>
                            </span>
                            <Badge tone="slate">{semesterUnits} units</Badge>
                          </button>
                          <AnimatePresence initial={false}>
                            {semesterOpen && (
                              <motion.div
                                key="semester-body"
                                variants={sectionBodyVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="overflow-hidden"
                              >
                                <ul className="divide-y divide-slate-200 dark:divide-white/10">
                                  {semesterRows.map((row) => (
                                    <li
                                      key={row.key}
                                      className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 font-body text-sm ${
                                        row.tempId ? "bg-gold-400/10" : ""
                                      }`}
                                    >
                                      <span className="w-24 shrink-0 font-medium text-navy-700 dark:text-white">
                                        {row.code}
                                      </span>
                                      {/* min-w keeps the title from collapsing; overflowing
                              meta wraps to the next line instead. */}
                                      <span className="min-w-40 flex-1 text-slate-600 dark:text-slate-300">
                                        {row.title}
                                      </span>
                                      <span className="shrink-0 text-slate-500 dark:text-slate-400">
                                        {row.units} units
                                      </span>
                                      <span className="shrink-0">
                                        <SubjectTypeBadge
                                          type={row.subjectType}
                                        />
                                      </span>
                                      <span className="flex shrink-0 flex-wrap gap-1">
                                        {row.prerequisites.map((code) => (
                                          <Badge key={code} tone="slate">
                                            {code}
                                          </Badge>
                                        ))}
                                      </span>
                                      {row.tempId ? (
                                        <span className="flex shrink-0 items-center gap-1.5">
                                          <Badge tone="gold">New</Badge>
                                          <DropdownMenu
                                            label={`Actions for ${row.code}`}
                                            items={[
                                              {
                                                label: "Edit",
                                                icon: <EditIcon />,
                                                onSelect: () =>
                                                  onEditPending(row.tempId!),
                                              },
                                              {
                                                label: "Delete",
                                                icon: <TrashIcon />,
                                                tone: "danger",
                                                onSelect: () =>
                                                  onRemovePending(row.tempId!),
                                              },
                                            ]}
                                          />
                                        </span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}
