import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Drawer } from "~/components/ui/drawer";
import { ChevronDownIcon, ChevronRightIcon, InfoCircleIcon } from "~/components/ui/icons";
import { Tooltip } from "~/components/ui/tooltip";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";

/** Major subject types are excluded from this overview by request. */
const EXCLUDED_TYPES = new Set(["Major with Lab", "Major without Lab"]);

/** Shown inside the info-icon tooltip on the card header. */
const OVERVIEW_NOTE =
  "Minor subjects offered this term and the instructors currently assigned to them. Major subjects " +
  "(with or without Lab) are not included because those are assigned by the Dean.";

type ProgramLike = {
  subjects: {
    code: string;
    title: string;
    subjectType?: string | null;
    semesterCategory: number;
    yearLevel: number;
  }[];
};

type EntryLike = {
  instructorName: string;
  department?: string | null;
  subjects: { subjectCode: string }[];
};

type SubjectRow = {
  code: string;
  title: string;
  subjectType?: string | null;
  yearLevel: number;
  instructors: { name: string; department: string | null }[];
};

type SubjectOfferingOverviewProps = {
  programs: ProgramLike[];
  entries: EntryLike[] | null;
  /** The selected term's semester (1 or 2); subjects are limited to it. */
  semesterNumber: number | null;
};

/** One subject dropdown; its badge is the number of assigned instructors. */
function SubjectInstructorRow({
  subject,
  open,
  onToggle,
}: {
  subject: SubjectRow;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white [overflow-anchor:none] dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/5"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="font-body text-sm font-semibold leading-tight tabular-nums text-navy-800 dark:text-mist-100">
              {subject.code}
            </span>
            {subject.subjectType ? <SubjectTypeBadge type={subject.subjectType} /> : null}
          </span>
          <span className="mt-0.5 block min-w-0 truncate font-body text-[11px] leading-tight text-slate-500 dark:text-slate-400">
            {subject.title}
          </span>
        </span>
        <span className="flex shrink-0 items-center justify-center gap-1.5 self-center">
          <Badge tone={subject.instructors.length > 0 ? "green" : "gold"}>
            {subject.instructors.length}
          </Badge>
          <span
            className={`text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <ChevronDownIcon />
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="subject-instructors"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.22, ease: [0.32, 0.72, 0, 1] }, opacity: { duration: 0.14 } }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-200/70 px-3 py-2 dark:border-white/10">
              {subject.instructors.length === 0 ? (
                <p className="font-body text-sm text-slate-500 dark:text-slate-400">
                  No instructor assigned.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {subject.instructors.map((instructor) => (
                    <li
                      key={`${instructor.name}:${instructor.department ?? ""}`}
                      className="flex items-baseline gap-2 font-body text-sm text-navy-700 dark:text-slate-200"
                    >
                      <span>{instructor.name}</span>
                      {instructor.department ? (
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {instructor.department}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Registrar Subject Offering overview: which offerable subjects for the selected
 * term's semester still have no instructor, and (in a dropdown) which already do
 * — grouped by year level, each subject expandable to show its assigned
 * instructor(s). Excludes the two Major subject types. Computed from the programs
 * catalog + this term's teaching-term assignments.
 */
export function SubjectOfferingOverview({
  programs,
  entries,
  semesterNumber,
}: SubjectOfferingOverviewProps) {
  const [openCodes, setOpenCodes] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const subjects = useMemo(() => {
    // Universe: every offerable subject for this semester, deduped by code.
    const universe = new Map<
      string,
      { code: string; title: string; subjectType?: string | null; yearLevel: number }
    >();
    for (const program of programs) {
      for (const subject of program.subjects) {
        if (semesterNumber != null && subject.semesterCategory !== semesterNumber) continue;
        if (subject.subjectType && EXCLUDED_TYPES.has(subject.subjectType)) continue;
        if (!universe.has(subject.code)) {
          universe.set(subject.code, {
            code: subject.code,
            title: subject.title,
            subjectType: subject.subjectType,
            yearLevel: subject.yearLevel,
          });
        }
      }
    }

    // Which of those subjects already have an instructor this term.
    const instructorsByCode = new Map<string, Map<string, string | null>>();
    for (const entry of entries ?? []) {
      for (const subject of entry.subjects) {
        if (!universe.has(subject.subjectCode)) continue;
        const instructors = instructorsByCode.get(subject.subjectCode) ?? new Map<string, string | null>();
        if (entry.instructorName) {
          instructors.set(entry.instructorName, entry.department ?? null);
        }
        instructorsByCode.set(subject.subjectCode, instructors);
      }
    }

    const rows: SubjectRow[] = [...universe.values()]
      .map((s) => ({
        ...s,
        instructors: [...(instructorsByCode.get(s.code) ?? new Map<string, string | null>())]
          .map(([name, department]) => ({ name, department }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));

    return rows.sort((a, b) => a.yearLevel - b.yearLevel || a.code.localeCompare(b.code));
  }, [programs, entries, semesterNumber]);
  const unassignedCount = subjects.filter((subject) => subject.instructors.length === 0).length;

  function toggleCode(code: string) {
    setOpenCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200/80 bg-white/90 p-0 shadow-sm shadow-slate-900/5 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          className="flex w-full items-center justify-between gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 sm:px-4 sm:py-3 dark:hover:bg-white/5"
        >
          <span className="min-w-0">
            <span className="block font-body text-[10px] uppercase tracking-[0.13em] text-slate-400">
              Offering overview — faculty assignments
            </span>
            <span className="mt-0.5 block font-display text-base leading-tight tracking-wide text-navy-700 dark:text-mist-100">
              Subjects and assigned instructors
            </span>
          </span>
          <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <Tooltip label={OVERVIEW_NOTE} direction="bottom" wrap>
              <span className="grid size-5 place-items-center text-slate-400" aria-label="About excluded major subjects">
                <InfoCircleIcon size={15} />
              </span>
            </Tooltip>
            <Badge tone="slate">Majors not included</Badge>
            <Badge tone={unassignedCount > 0 ? "gold" : "green"}>{unassignedCount} unassigned</Badge>
            <span className="ml-1 text-slate-400" aria-hidden="true"><ChevronRightIcon /></span>
          </span>
        </button>
      </Card>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Offering Overview"
        description={`${subjects.length} minor ${subjects.length === 1 ? "subject" : "subjects"} offered this term`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip label={OVERVIEW_NOTE} direction="bottom" wrap>
            <span
              tabIndex={0}
              className="grid size-5 place-items-center rounded-full text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              aria-label="About excluded major subjects"
            >
              <InfoCircleIcon size={15} />
            </span>
          </Tooltip>
          <Badge tone="slate">Majors not included</Badge>
          <Badge tone={unassignedCount > 0 ? "gold" : "green"}>{unassignedCount} unassigned</Badge>
        </div>

        <h3 className="mt-5 font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
          Subjects and assigned instructors
        </h3>

        <div className="mt-3">
          {subjects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center font-body text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              No minor subjects are offered for this term.
            </p>
          ) : (
            <div className="flex flex-col gap-2 [overflow-anchor:none]">
              {subjects.map((subject) => (
                <SubjectInstructorRow
                  key={subject.code}
                  subject={subject}
                  open={openCodes.has(subject.code)}
                  onToggle={() => toggleCode(subject.code)}
                />
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}