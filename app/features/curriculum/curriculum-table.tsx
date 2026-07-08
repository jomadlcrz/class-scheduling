import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { ChevronDownIcon, ChevronRightIcon } from "~/components/ui/icons";
import { CurriculumSubjects } from "~/features/curriculum/curriculum-subjects";
import type { CurriculumGroup, ProgramCurriculum } from "~/types/curriculum";
import type { YearLevel } from "~/types/subject";
import { SEMESTER_LABELS, YEAR_LEVEL_LABELS } from "~/types/subject";

type CurriculumTableProps = {
  curriculum: ProgramCurriculum;
  /** Filters visible subjects by code/title match; matching sections auto-expand. */
  search?: string;
};

export function CurriculumTable({ curriculum, search = "" }: CurriculumTableProps) {
  const query = search.trim().toLowerCase();

  const codeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of curriculum.groups) {
      for (const subject of group.subjects) {
        map.set(subject.id, subject.code);
      }
    }
    return map;
  }, [curriculum]);

  const filteredGroups = useMemo(() => {
    if (!query) return curriculum.groups;
    return curriculum.groups
      .map((group) => {
        const subjects = group.subjects.filter(
          (s) => s.code.toLowerCase().includes(query) || s.title.toLowerCase().includes(query),
        );
        return { ...group, subjects, totalUnits: subjects.reduce((sum, s) => sum + s.units, 0) };
      })
      .filter((group) => group.subjects.length > 0);
  }, [curriculum, query]);

  const yearLevels = [...new Set(filteredGroups.map((g) => g.yearLevel))].sort() as YearLevel[];

  if (query && yearLevels.length === 0) {
    return (
      <EmptyState title="No subjects found">
        No subjects match your search.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {yearLevels.map((year) => {
        const yearGroups = filteredGroups.filter((g) => g.yearLevel === year);
        const yearUnits = yearGroups.reduce((sum, g) => sum + g.totalUnits, 0);
        return (
          <YearBlock
            key={year}
            yearLevel={year}
            yearUnits={yearUnits}
            groups={yearGroups}
            codeById={codeById}
            forceOpen={query.length > 0}
          />
        );
      })}
    </div>
  );
}

function YearBlock({
  yearLevel,
  yearUnits,
  groups,
  codeById,
  forceOpen,
}: {
  yearLevel: YearLevel;
  yearUnits: number;
  groups: CurriculumGroup[];
  codeById: Map<string, string>;
  forceOpen: boolean;
}) {
  const [open, setOpen] = useState(true);
  const reduceMotion = useReducedMotion();
  const isOpen = open || forceOpen;

  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400"
      >
        <span className="font-body text-base font-semibold text-navy-700 dark:text-white">
          {YEAR_LEVEL_LABELS[yearLevel]}
        </span>
        <span className="flex items-center gap-2">
          <Badge tone="gold">{yearUnits} units</Badge>
          <span className="text-slate-400 dark:text-slate-500">
            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-200 p-5 dark:border-white/8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {groups.map((group) => (
                  <SemesterCard key={group.semester} group={group} codeById={codeById} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SemesterCard({ group, codeById }: { group: CurriculumGroup; codeById: Map<string, string> }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-navy-800/60">
      <div className="px-3 py-2 text-center">
        <span className="font-body text-sm font-semibold text-navy-700 dark:text-white">
          {SEMESTER_LABELS[group.semester]}
        </span>
      </div>
      <div className="flex-1">
        <CurriculumSubjects group={group} codeById={codeById} />
      </div>
    </div>
  );
}
