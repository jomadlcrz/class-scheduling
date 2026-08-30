import { useMemo, useState } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Drawer } from "~/components/ui/drawer";
import { ChevronDownIcon, ChevronRightIcon, InfoCircleIcon } from "~/components/ui/icons";
import { Spinner } from "~/components/ui/spinner";
import { Tooltip } from "~/components/ui/tooltip";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { useCachedData } from "~/hooks/use-cached-data";
import { deanService } from "~/services/dean.service";
import type {
  OfferingCoverage,
  OfferingCoverageDepartment,
  OfferingCoverageProgram,
  OfferingCoverageSubject,
} from "~/types/offering-coverage";

export type CoverageDrillTarget = {
  id: number;
  name: string;
  abbrev: string;
};

type OfferingCoverageOverviewProps = {
  syId: number | null;
  semesterNumber: number | null;
  /** Open one department's scoped assign view (Level 2). */
  onDrillIn?: (target: CoverageDrillTarget) => void;
  /** Dean's read-only panel: lists every subject and who teaches it. */
  readOnly?: boolean;
};

const COVERAGE_NOTE =
  "Non-major subjects are shared across programs. Once one is assigned to an instructor in any program, it counts as covered for every curriculum carrying it, even when the instructor belongs to another department. Major subjects are excluded because they are assigned by the Dean.";

/** One offered subject — assigned or not — expandable to reveal its instructors. */
function CoverageSubjectRow({ subject }: { subject: OfferingCoverageSubject }) {
  const [open, setOpen] = useState(false);
  const instructorCount = subject.instructors.length;

  return (
    <li
      className="rounded-lg border border-slate-200/80 px-3 py-2.5 dark:border-white/10"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="font-body text-sm font-semibold leading-tight tabular-nums text-navy-800 dark:text-mist-100">
              {subject.subject_code}
            </span>
            {subject.subject_type ? <SubjectTypeBadge type={subject.subject_type} /> : null}
          </span>
          <span className="mt-0.5 block min-w-0 truncate font-body text-[11px] leading-tight text-slate-500 dark:text-slate-400">
            {subject.descriptive_title}
          </span>
        </span>
        <span className="flex shrink-0 items-center justify-center gap-1.5 self-center">
          <Badge tone={instructorCount > 0 ? "green" : "gold"}>{instructorCount}</Badge>
          <span
            className={`text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <ChevronDownIcon />
          </span>
        </span>
      </button>

      {open && (
        <div className="mt-1.5 border-t border-slate-200/80 pt-2 dark:border-white/10">
          {instructorCount === 0 ? (
            <p className="pb-0.5 font-body text-sm text-slate-500 dark:text-slate-400">
              {subject.assigned ? "Instructor assigned." : "No instructor assigned."}
            </p>
          ) : (
            <ul className="flex flex-col gap-1 pb-0.5">
              {subject.instructors.map((name) => (
                <li
                  key={name}
                  className="flex items-baseline gap-2 font-body text-sm font-medium text-navy-800 dark:text-mist-100"
                >
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

/** One program's offered subjects — every subject listed, assigned and not. */
function ProgramCoverageRow({
  program,
  defaultOpen = false,
}: {
  program: OfferingCoverageProgram;
  defaultOpen?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(!defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className={`text-slate-400 transition-transform duration-150 ${collapsed ? "-rotate-90" : ""}`} aria-hidden="true">
            <ChevronDownIcon />
          </span>
          <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
            {program.program_abbrev}
          </span>
          <span className="min-w-0 truncate font-body text-xs text-slate-500 dark:text-slate-400">
            {program.program_name}
          </span>
        </span>
        <span className="shrink-0 font-body text-xs text-slate-400 dark:text-slate-500">
          {program.subjects.length} subject{program.subjects.length === 1 ? "" : "s"}
        </span>
      </button>
      {!collapsed && program.subjects.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {program.subjects.map((subject) => (
            <CoverageSubjectRow key={subject.curriculum_detail_id} subject={subject} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DepartmentAccordionItem({
  department,
  onDrillIn,
  readOnly = false,
}: {
  department: OfferingCoverageDepartment;
  onDrillIn?: (target: CoverageDrillTarget) => void;
  readOnly?: boolean;
}) {
  const coveredThisTerm = useMemo(() => {
    const status = new Map<number, boolean>();
    for (const program of department.programs) {
      for (const subject of program.subjects) {
        status.set(subject.subject_id, subject.assigned);
      }
    }
    const unassigned = [...status.values()].filter((assigned) => !assigned).length;
    return { total: status.size, unassigned };
  }, [department.programs]);

  return (
    <AccordionItem
      defaultOpen={readOnly}
      title={
        <span className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-base tracking-widest text-navy-700 dark:text-mist-100">
              {department.department_abbrev}
            </span>
            <span className="min-w-0 truncate font-body text-xs text-slate-500 dark:text-slate-400">
              {department.department_name}
            </span>
          </span>
          <span className="mt-0.5 font-body text-xs text-slate-400 dark:text-slate-500">
            {coveredThisTerm.total} minor{semNumberLabel(coveredThisTerm.total)} offered
          </span>
        </span>
      }
      adornment={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={coveredThisTerm.unassigned > 0 ? "gold" : "green"}>
            {coveredThisTerm.unassigned > 0
              ? `${coveredThisTerm.unassigned} unassigned`
              : "fully covered"}
          </Badge>
          {!readOnly && onDrillIn && (
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() =>
                onDrillIn({
                  id: department.department_id,
                  name: department.department_name,
                  abbrev: department.department_abbrev,
                })
              }
            >
              Manage
            </Button>
          )}
        </div>
      }
      adornmentPosition="below"
    >
      <div className="flex flex-col gap-2 p-3 sm:p-4">
        {department.programs.map((program) => (
          <ProgramCoverageRow key={program.program_id} program={program} />
        ))}
      </div>
    </AccordionItem>
  );
}

function semNumberLabel(count: number) {
  return count === 1 ? " subject" : " subjects";
}

export function OfferingCoverageOverview({
  syId,
  semesterNumber,
  onDrillIn,
  readOnly = false,
}: OfferingCoverageOverviewProps) {
  const hasTerm = syId != null && semesterNumber != null;
  // v2 key: the v1 slot may hold an unscoped payload persisted by an earlier
  // build, so it is never read again.
  const key = hasTerm ? `offering-coverage:v2:${syId}:${semesterNumber}` : "offering-coverage:none";
  const { data, error } = useCachedData<OfferingCoverage>(
    key,
    () => deanService.getOfferingCoverage(syId as number, semesterNumber as number),
    { enabled: hasTerm },
  );

  // The coverage API is scoped to the selected term, so rows are shown as-is.
  const coverageStats = useMemo(() => {
    const status = new Map<number, boolean>();
    for (const department of data?.departments ?? []) {
      for (const program of department.programs) {
        for (const subject of program.subjects) {
          status.set(subject.subject_id, subject.assigned);
        }
      }
    }
    return {
      total: status.size,
      unassigned: [...status.values()].filter((assigned) => !assigned).length,
    };
  }, [data]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!hasTerm) {
    return (
      <EmptyState title="Select a term">
        Choose an academic term to see which subjects still need a faculty.
      </EmptyState>
    );
  }

  if (error) {
    return <EmptyState title="Unable to load coverage">{error}</EmptyState>;
  }

  if (data == null) {
    return (
      <div role="status" aria-label="Loading coverage" className="grid place-items-center py-12">
        <Spinner />
      </div>
    );
  }

  if (coverageStats.total === 0) {
    return (
      <EmptyState title="Nothing to offer this term">
        No active programs have minor subjects encoded for the selected term.
      </EmptyState>
    );
  }

  const coverageBadges = (withUnassigned: boolean) => (
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip label={COVERAGE_NOTE} direction="bottom" wrap>
        <span
          tabIndex={0}
          className="grid size-5 place-items-center rounded-full text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          aria-label="About shared minor subjects and excluded majors"
        >
          <InfoCircleIcon size={15} />
        </span>
      </Tooltip>
      <Badge tone="slate">Majors not included</Badge>
      {withUnassigned && (
        <Badge tone={coverageStats.unassigned > 0 ? "gold" : "green"}>
          {coverageStats.unassigned} unassigned
        </Badge>
      )}
    </div>
  );

  const departmentsList = (
    <Accordion>
      {data.departments.map((department) => (
        <DepartmentAccordionItem
          key={department.department_id}
          department={department}
          onDrillIn={onDrillIn}
          readOnly={readOnly}
        />
      ))}
    </Accordion>
  );

  if (readOnly) {
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
                Minor subject coverage
              </span>
              <span className="mt-0.5 block font-display text-base leading-tight tracking-wide text-navy-700 dark:text-mist-100">
                Shared subjects and assigned instructors
              </span>
            </span>
            <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <Tooltip label={COVERAGE_NOTE} direction="bottom" wrap>
                <span
                  className="grid size-5 place-items-center text-slate-400"
                  aria-label="About shared minor subjects and excluded majors"
                >
                  <InfoCircleIcon size={15} />
                </span>
              </Tooltip>
              <Badge tone="slate">Majors not included</Badge>
              <Badge tone={coverageStats.unassigned > 0 ? "gold" : "green"}>
                {coverageStats.unassigned} unassigned
              </Badge>
              <span className="ml-1 text-slate-400" aria-hidden="true">
                <ChevronRightIcon />
              </span>
            </span>
          </button>
        </Card>

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Shared Subject Coverage"
          description="Minor subjects and the instructors currently covering them"
        >
          {coverageBadges(true)}
          <div className="mt-3 flex flex-col gap-2">
            {(data.departments ?? [])
              .flatMap((department) => department.programs)
              .map((program) => (
                <ProgramCoverageRow key={program.program_id} program={program} defaultOpen />
              ))}
          </div>
        </Drawer>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
          College coverage — who still needs a faculty
        </h2>
        {coverageBadges(false)}
      </div>
      {departmentsList}
    </div>
  );
}